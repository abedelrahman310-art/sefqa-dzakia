from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Tender, TenderBid
from .forms import TenderForm, TenderBidForm


def tender_list(request):
    """Display list of all published tenders."""
    tenders = Tender.objects.filter(status='published').order_by('-created_at')
    return render(request, 'tenders/list.html', {'tenders': tenders})


def tender_detail(request, pk):
    """Display details of a specific tender."""
    tender = get_object_or_404(Tender, pk=pk)
    
    if request.method == 'POST' and request.user.is_authenticated:
        form = TenderBidForm(request.POST)
        if form.is_valid():
            bid = form.save(commit=False)
            bid.tender = tender
            bid.bidder = request.user
            bid.save()
            messages.success(request, 'Your bid has been submitted successfully!')
            return redirect('tenders:detail', pk=tender.pk)
    else:
        form = TenderBidForm()
    
    bids = tender.bids.all() if request.user.is_authenticated else None
    
    return render(request, 'tenders/detail.html', {
        'tender': tender,
        'form': form,
        'bids': bids
    })


@login_required
def tender_create(request):
    """Create a new tender."""
    if request.method == 'POST':
        form = TenderForm(request.POST, request.FILES)
        if form.is_valid():
            tender = form.save(commit=False)
            tender.created_by = request.user
            tender.save()
            messages.success(request, 'Tender created successfully!')
            return redirect('tenders:detail', pk=tender.pk)
    else:
        form = TenderForm()
    
    return render(request, 'tenders/form.html', {'form': form, 'action': 'Create'})


@login_required
def tender_update(request, pk):
    """Update an existing tender."""
    tender = get_object_or_404(Tender, pk=pk, created_by=request.user)
    
    if request.method == 'POST':
        form = TenderForm(request.POST, request.FILES, instance=tender)
        if form.is_valid():
            form.save()
            messages.success(request, 'Tender updated successfully!')
            return redirect('tenders:detail', pk=tender.pk)
    else:
        form = TenderForm(instance=tender)
    
    return render(request, 'tenders/form.html', {'form': form, 'action': 'Update'})


@login_required
def tender_delete(request, pk):
    """Delete a tender."""
    tender = get_object_or_404(Tender, pk=pk, created_by=request.user)
    
    if request.method == 'POST':
        tender.delete()
        messages.success(request, 'Tender deleted successfully!')
        return redirect('tenders:list')
    
    return render(request, 'tenders/confirm_delete.html', {'tender': tender})
