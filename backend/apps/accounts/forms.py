from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser


class CustomUserCreationForm(UserCreationForm):
    """Form for creating a new user."""
    
    email = forms.EmailField(required=True)
    phone = forms.CharField(required=False, max_length=20)
    company = forms.CharField(required=False, max_length=255)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'phone', 'company', 'password1', 'password2')


class CustomAuthenticationForm(AuthenticationForm):
    """Custom authentication form."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = 'Email / Username'
