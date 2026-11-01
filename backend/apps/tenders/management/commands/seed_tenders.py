from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.tenders.models import Tender
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with sample tender data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding tender data...')

        # Get or create a test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user: {user.username}'))

        # Sample tenders data
        sample_tenders = [
            {
                'title': 'Construction of Community Center',
                'description': 'We are looking for a qualified contractor to build a new community center including gymnasium, meeting rooms, and outdoor facilities.',
                'reference_number': 'TND-2024-001',
                'organization': 'City Municipal Council',
                'category': 'Construction',
                'budget_min': 500000,
                'budget_max': 750000,
                'deadline': timezone.now() + timedelta(days=30),
                'status': 'published',
                'location': 'New York, NY',
                'requirements': 'Must have at least 5 years experience in commercial construction. Valid contractor license required.',
            },
            {
                'title': 'IT Infrastructure Upgrade',
                'description': 'Complete overhaul of existing IT infrastructure including servers, networking equipment, and security systems.',
                'reference_number': 'TND-2024-002',
                'organization': 'Tech Solutions Inc',
                'category': 'Information Technology',
                'budget_min': 100000,
                'budget_max': 200000,
                'deadline': timezone.now() + timedelta(days=45),
                'status': 'published',
                'location': 'San Francisco, CA',
                'requirements': 'Cisco certified professionals preferred. Experience with enterprise-level deployments required.',
            },
            {
                'title': 'Office Cleaning Services Contract',
                'description': 'Annual contract for daily office cleaning services for a 5-story office building.',
                'reference_number': 'TND-2024-003',
                'organization': 'Business Park Management',
                'category': 'Facility Management',
                'budget_min': 50000,
                'budget_max': 80000,
                'deadline': timezone.now() + timedelta(days=15),
                'status': 'published',
                'location': 'Chicago, IL',
                'requirements': 'Licensed and insured cleaning company. References from similar projects required.',
            },
            {
                'title': 'Marketing Campaign Development',
                'description': 'Development and execution of a comprehensive digital marketing campaign for product launch.',
                'reference_number': 'TND-2024-004',
                'organization': 'Global Brands Ltd',
                'category': 'Marketing',
                'budget_min': 75000,
                'budget_max': 150000,
                'deadline': timezone.now() + timedelta(days=20),
                'status': 'published',
                'location': 'Remote',
                'requirements': 'Portfolio of successful campaigns required. Social media expertise essential.',
            },
            {
                'title': 'Fleet Vehicle Maintenance',
                'description': '12-month contract for maintenance and repair of company fleet vehicles (approximately 50 vehicles).',
                'reference_number': 'TND-2024-005',
                'organization': 'Logistics Corp',
                'category': 'Automotive',
                'budget_min': 120000,
                'budget_max': 180000,
                'deadline': timezone.now() + timedelta(days=25),
                'status': 'draft',
                'location': 'Dallas, TX',
                'requirements': 'Certified mechanics. 24/7 emergency service capability preferred.',
            },
        ]

        created_count = 0
        updated_count = 0

        for tender_data in sample_tenders:
            tender, created = Tender.objects.update_or_create(
                reference_number=tender_data['reference_number'],
                defaults={
                    **tender_data,
                    'created_by': user,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created tender: {tender.title}'))
            else:
                updated_count += 1
                self.stdout.write(f'Updated tender: {tender.title}')

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully seeded {created_count} new tenders and updated {updated_count} existing tenders.'))
        self.stdout.write(self.style.WARNING(f'\nTest user credentials: username=testuser, password=password123'))
