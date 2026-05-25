from django.db import models
from django.conf import settings


class Tender(models.Model):
    """Tender model for managing tender opportunities."""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('closed', 'Closed'),
        ('awarded', 'Awarded'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    reference_number = models.CharField(max_length=100, unique=True)
    organization = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    budget_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    location = models.CharField(max_length=255, blank=True)
    requirements = models.TextField(blank=True)
    documents = models.FileField(upload_to='tenders/documents/', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tenders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.reference_number})"

    class Meta:
        verbose_name = 'Tender'
        verbose_name_plural = 'Tenders'
        ordering = ['-created_at']


class TenderBid(models.Model):
    """Model for tracking bids on tenders."""
    
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='bids')
    bidder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    proposal = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ], default='pending')

    def __str__(self):
        return f"Bid by {self.bidder.username} for {self.tender.title}"

    class Meta:
        verbose_name = 'Tender Bid'
        verbose_name_plural = 'Tender Bids'
        unique_together = ['tender', 'bidder']
