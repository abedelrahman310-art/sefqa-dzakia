import os
import base64
import hashlib
from typing import Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings

def get_aes_key() -> bytes:
    """
    استرجاع أو اشتقاق مفتاح تشفير AES-256 متماثل (32 بايت).
    """
    secret = 'safaqat-procurement-secret-key-2026'
    if settings.configured:
        custom_key = getattr(settings, 'BID_ENCRYPTION_KEY', None)
        if custom_key:
            if isinstance(custom_key, str):
                custom_key = custom_key.encode('utf-8')
            if len(custom_key) == 32:
                return custom_key
        secret = getattr(settings, 'SECRET_KEY', secret)
    # اشتقاق مفتاح 256-bit باستخدام SHA-256 من SECRET_KEY
    return hashlib.sha256(secret.encode('utf-8')).digest()

def encrypt_data(plaintext: Union[str, bytes]) -> str:
    """
    تشفير البيانات باستخدام AES-256-GCM.
    يعيد النص المشفر مرمزاً بـ Base64 مع الـ Nonce.
    """
    if plaintext is None:
        return ''
    if isinstance(plaintext, str):
        plaintext = plaintext.encode('utf-8')
    key = get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce for AES-GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return base64.b64encode(nonce + ciphertext).decode('utf-8')

def decrypt_data(b64_ciphertext: str) -> str:
    """
    فك تشفير البيانات المشفرة بـ AES-256-GCM من نص Base64.
    """
    if not b64_ciphertext:
        return ''
    try:
        raw = base64.b64decode(b64_ciphertext.encode('utf-8'))
        nonce = raw[:12]
        ciphertext = raw[12:]
        key = get_aes_key()
        aesgcm = AESGCM(key)
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode('utf-8')
    except Exception as exc:
        raise ValueError(f"فشل فك التشفير التشفيري (AES-256): {exc}") from exc

def encrypt_bytes(data: bytes) -> bytes:
    """
    تشفير مصفوفة بايتات (ملف أو وثيقة) بـ AES-256-GCM.
    """
    key = get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext

def decrypt_bytes(encrypted_bytes: bytes) -> bytes:
    """
    فك تشفير مصفوفة بايتات مشفرة بـ AES-256-GCM.
    """
    nonce = encrypted_bytes[:12]
    ciphertext = encrypted_bytes[12:]
    key = get_aes_key()
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)
