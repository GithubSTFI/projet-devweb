import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
    templateUrl: './auth-layout.component.html',
    styleUrls: ['./auth-layout.component.scss'],
    animations: [
        trigger('cardAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.9) translateY(20px)' }),
                animate('600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
            ])
        ]),
        trigger('fadeSlide', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('400ms 200ms ease-out',
                    style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('formSlide', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateX(20px)' }),
                animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
                    style({ opacity: 1, transform: 'translateX(0)' }))
            ]),
            transition(':leave', [
                animate('300ms cubic-bezier(0.4, 0, 1, 1)',
                    style({ opacity: 0, transform: 'translateX(-20px)' }))
            ])
        ])
    ]
})
export class AuthLayoutComponent implements OnInit {
    loginForm!: FormGroup;
    registerForm!: FormGroup;
    isSignUpMode = false;
    loginError = '';
    registerError = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });

        this.registerForm = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        if (!password || !confirmPassword) return null;

        if (confirmPassword.value === '') return null;

        if (password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ mismatch: true });
            return { mismatch: true };
        }

        confirmPassword.setErrors(null);
        return null;
    }

    setMode(isSignUp: boolean) {
        this.isSignUpMode = isSignUp;
        this.loginError = '';
        this.registerError = '';
    }

    toggleMode() {
        this.setMode(!this.isSignUpMode);
    }

    get fLog() {
        return this.loginForm.controls;
    }

    get fReg() {
        return this.registerForm.controls;
    }

    onLogin() {
        if (this.loginForm.invalid) return;

        const credentials = {
            username: this.loginForm.value.username,
            password: this.loginForm.value.password
        };

        this.authService.login(credentials).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loginError = err.error?.message || 'Identifiants incorrects';
            }
        });
    }

    onRegister() {
        if (this.registerForm.invalid) return;

        const credentials = {
            username: this.registerForm.value.username,
            email: this.registerForm.value.email,
            password: this.registerForm.value.password
        };

        this.authService.register(credentials).subscribe({
            next: () => {
                this.setMode(false);
                this.loginForm.patchValue({
                    username: credentials.username,
                    password: credentials.password
                });
            },
            error: (err) => {
                this.registerError = err.error?.message || 'Erreur lors de l\'inscription';
            }
        });
    }
}
