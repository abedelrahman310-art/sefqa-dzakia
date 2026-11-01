from django import forms
from .models import Tender, TenderBid


class TenderForm(forms.ModelForm):
    """Form for creating and editing tenders."""
    
    class Meta:
        model = Tender
        fields = [
            'title', 'description', 'reference_number', 'organization',
            'category', 'budget_min', 'budget_max', 'currency', 'deadline',
            'status', 'location', 'requirements', 'documents'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 5}),
            'requirements': forms.Textarea(attrs={'rows': 4}),
            'deadline': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
        }


class TenderBidForm(forms.ModelForm):
    """Form for submitting bids on tenders."""
    
    class Meta:
        model = TenderBid
        fields = ['amount', 'proposal']
        widgets = {
            'proposal': forms.Textarea(attrs={'rows': 5}),
        }
