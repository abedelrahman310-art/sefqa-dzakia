from django import forms
from .models import PDFDocument


class PDFUploadForm(forms.ModelForm):
    """Form for uploading PDF documents."""
    
    class Meta:
        model = PDFDocument
        fields = ['title', 'file']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['file'].widget.attrs.update({'accept': '.pdf'})
