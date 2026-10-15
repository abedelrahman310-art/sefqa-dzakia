from rest_framework import viewsets, status, permissions, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError

from .models import AwardDecision, Contract, AwardObjection
from .serializers import (
    AwardDecisionSerializer,
    ContractSerializer,
    ObjectionListSerializer,
    ObjectionDetailSerializer,
    ObjectionCreateSerializer,
    ObjectionDecisionSerializer,
)
from .permissions import IsObjectionReviewer
from .services.objections import (
    create_objection,
    start_review,
    decide_objection,
    withdraw_objection,
)


class AwardDecisionViewSet(viewsets.ModelViewSet):
    """إدارة قرارات الإسناد والطعون"""
    queryset = AwardDecision.objects.all().select_related('deal', 'awarded_bid__operator')
    serializer_class = AwardDecisionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'authority':
            return self.queryset.filter(deal__authority=user)
        elif user.role == 'operator':
            return self.queryset.filter(awarded_bid__operator=user)
        return self.queryset

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'central_admin':
            raise exceptions.PermissionDenied('جهة الرقابة المركزية دورها رقابي وتدقيقي ولا يحق لها تعديل نتائج التقييم والإسناد.')
        if user.role != 'authority':
            raise exceptions.PermissionDenied('المصلحة المتعاقدة صاحبة الصفقة فقط مخولة بتعديل قرار الإسناد.')
        serializer.save()


class ContractViewSet(viewsets.ModelViewSet):
    """إدارة العقود المبرمة والتنفيذ"""
    queryset = Contract.objects.all().select_related('deal', 'awarded_operator')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'authority':
            return self.queryset.filter(deal__authority=user)
        elif user.role == 'operator':
            return self.queryset.filter(awarded_operator=user)
        return self.queryset


class ObjectionViewSet(viewsets.ModelViewSet):
    """
    إدارة ومتابعة الطعون على الإسناد وفق المادة 72 من القانون 23-12
    """
    queryset = AwardObjection.objects.all().select_related('tender', 'objector', 'contested_operator', 'reviewer').prefetch_related('timeline__actor')
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ObjectionCreateSerializer
        if self.action == 'retrieve':
            return ObjectionDetailSerializer
        return ObjectionListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if user.role == "central_admin":
            return qs
        if user.role == "authority":
            return qs.filter(tender__authority=user)
        if user.role == "operator":
            return qs.filter(objector=user)
        return qs.none()

    def create(self, request, *args, **kwargs):
        serializer = ObjectionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            from apps.procurements.models import ProcurementDeal
            from apps.users.models import CustomUser

            tender = ProcurementDeal.objects.get(
                id=serializer.validated_data["tender_id"]
            )

            contested = None
            if serializer.validated_data.get("contested_operator_id"):
                contested = CustomUser.objects.get(
                    id=serializer.validated_data["contested_operator_id"]
                )

            objection = create_objection(
                tender=tender,
                objector=request.user,
                objection_type=serializer.validated_data["objection_type"],
                grounds=serializer.validated_data["grounds"],
                description=serializer.validated_data["description"],
                contested_operator=contested,
                objector_ip=request.META.get("REMOTE_ADDR"),
            )

            return Response(
                ObjectionDetailSerializer(objection).data,
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response(
                {"detail": e.message if hasattr(e, 'message') else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"detail": f"خطأ في الإنشاء: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['post'],
            permission_classes=[IsAuthenticated, IsObjectionReviewer])
    def start_review(self, request, pk=None):
        objection = self.get_object()
        try:
            objection = start_review(objection, request.user)
            return Response(ObjectionDetailSerializer(objection).data)
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['post'],
            permission_classes=[IsAuthenticated, IsObjectionReviewer])
    def decide(self, request, pk=None):
        serializer = ObjectionDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        objection = self.get_object()
        try:
            objection = decide_objection(
                objection,
                request.user,
                serializer.validated_data["decision"],
                serializer.validated_data["reason"],
            )
            return Response(ObjectionDetailSerializer(objection).data)
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        objection = self.get_object()
        try:
            objection = withdraw_objection(objection, request.user)
            return Response(ObjectionDetailSerializer(objection).data)
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
