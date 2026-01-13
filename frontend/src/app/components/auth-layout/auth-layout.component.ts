import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../auth.service';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './auth-layout.component.html',
    styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent {
    auth = inject(AuthService);
    fb = inject(FormBuilder);

    isSignUpMode = false;
    loginError = '';
    registerError = '';

    // LOGIN FORM
    loginForm: FormGroup = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required]
    });

    // REGISTER FORM
    registerForm: FormGroup = this.fb.group({
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Getters for easy access in template
    get fLog() { return this.loginForm.controls; }
    get fReg() { return this.registerForm.controls; }

    toggleMode() {
        this.isSignUpMode = !this.isSignUpMode;
        this.loginError = '';
        this.registerError = '';
    }

    passwordMatchValidator(control: AbstractControl) {
        const password = control.get('password');
        const confirm = control.get('confirmPassword');
        if (password && confirm && password.value !== confirm.value) {
            confirm.setErrors({ mismatch: true });
            return { mismatch: true };
        }
        return null;
    }

    onLogin() {
        if (this.loginForm.invalid) return;

        this.auth.login(this.loginForm.value).subscribe({
            next: () => { },
            error: (err) => this.loginError = err.error?.error || 'Erreur login'
        });
    }

    onRegister() {
        if (this.registerForm.invalid) return;

        // Send only necessary fields (exclude confirmPassword)
        const { confirmPassword, ...registerData } = this.registerForm.value;

        this.auth.register(registerData).subscribe({
            next: () => {
                alert('Compte créé ! Veuillez vous connecter.');
                this.toggleMode();
                // Prefill username
                this.loginForm.patchValue({ username: registerData.username });
                this.registerForm.reset();
            },
            error: (err) => {
                this.registerError = err.error?.error || 'Erreur inscription';
            }
        });
    }
}
