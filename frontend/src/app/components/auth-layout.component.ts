import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-body">
      <div class="container" [class.right-panel-active]="isSignUpMode">
        
        <!-- SIGN UP FORM (Left) -->
        <div class="form-container sign-up-container">
          <form [formGroup]="registerForm" (ngSubmit)="onRegister()">
            <h1>Créer un compte</h1>
            <div class="social-container">
              <a href="#" class="social"><i class="fab fa-google"></i>G</a>
            </div>
            <span>ou utilisez votre email pour l'inscription</span>
            
            <!-- Username -->
            <div class="input-group">
                <input type="text" formControlName="username" placeholder="Nom d'utilisateur" 
                       [class.is-invalid]="fReg['username'].touched && fReg['username'].invalid" />
                <div class="invalid-feedback" *ngIf="fReg['username'].touched && fReg['username'].errors">
                    <span *ngIf="fReg['username'].errors['required']">Le nom est requis</span>
                    <span *ngIf="fReg['username'].errors['minlength']">Minimum 3 caractères</span>
                </div>
            </div>

            <!-- Email -->
            <div class="input-group">
                <input type="email" formControlName="email" placeholder="Email"
                       [class.is-invalid]="fReg['email'].touched && fReg['email'].invalid" />
                <div class="invalid-feedback" *ngIf="fReg['email'].touched && fReg['email'].errors">
                    <span *ngIf="fReg['email'].errors['required']">L'email est requis</span>
                    <span *ngIf="fReg['email'].errors['email']">Format email invalide</span>
                </div>
            </div>

            <!-- Password -->
            <div class="input-group">
                <input type="password" formControlName="password" placeholder="Mot de passe"
                       [class.is-invalid]="fReg['password'].touched && fReg['password'].invalid" />
                <div class="invalid-feedback" *ngIf="fReg['password'].touched && fReg['password'].errors">
                    <span *ngIf="fReg['password'].errors['required']">Le mot de passe est requis</span>
                    <span *ngIf="fReg['password'].errors['minlength']">Minimum 6 caractères</span>
                </div>
            </div>

            <!-- Confirm Password -->
            <div class="input-group">
                <input type="password" formControlName="confirmPassword" placeholder="Confirmer le mot de passe"
                       [class.is-invalid]="fReg['confirmPassword'].touched && fReg['confirmPassword'].invalid" />
                <div class="invalid-feedback" *ngIf="fReg['confirmPassword'].touched && fReg['confirmPassword'].errors">
                    <span *ngIf="fReg['confirmPassword'].errors['required']">Confirmation requise</span>
                    <span *ngIf="fReg['confirmPassword'].errors['mismatch']">Les mots de passe ne correspondent pas</span>
                </div>
            </div>

            <button type="submit" [disabled]="registerForm.invalid">S'inscrire</button>
            <p *ngIf="registerError" class="error-msg">{{ registerError }}</p>
          </form>
        </div>

        <!-- SIGN IN FORM (Right) -->
        <div class="form-container sign-in-container">
          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <h1>Se connecter</h1>
            <div class="social-container">
              <a href="#" class="social"><i class="fab fa-google"></i>G</a>
            </div>
            <span>ou utilisez votre compte</span>
            
            <div class="input-group">
                <input type="text" formControlName="username" placeholder="Identifiant"
                       [class.is-invalid]="fLog['username'].touched && fLog['username'].invalid" />
                <div class="invalid-feedback" *ngIf="fLog['username'].touched && fLog['username'].errors">
                    <span *ngIf="fLog['username'].errors['required']">Identifiant requis</span>
                </div>
            </div>

            <div class="input-group">
                <input type="password" formControlName="password" placeholder="Mot de passe"
                       [class.is-invalid]="fLog['password'].touched && fLog['password'].invalid" />
                <div class="invalid-feedback" *ngIf="fLog['password'].touched && fLog['password'].errors">
                    <span *ngIf="fLog['password'].errors['required']">Mot de passe requis</span>
                </div>
            </div>

            <a href="#" class="forgot-pass">Mot de passe oublié ?</a>
            <button type="submit" [disabled]="loginForm.invalid">Connexion</button>
            <p *ngIf="loginError" class="error-msg">{{ loginError }}</p>
          </form>
        </div>

        <!-- OVERLAY -->
        <div class="overlay-container">
          <div class="overlay">
            <div class="overlay-panel overlay-left">
              <h1>Bon retour !</h1>
              <p>Restez connecté avec nous en utilisant vos identifiants personnels</p>
              <button class="ghost" (click)="toggleMode()">Se connecter</button>
            </div>
            <div class="overlay-panel overlay-right">
              <h1>Bonjour !</h1>
              <p>Entrez vos détails personnels et commencez votre voyage avec nous</p>
              <button class="ghost" (click)="toggleMode()">S'inscrire</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');

    .auth-body {
      background: #f6f5f7; display: flex; justify-content: center; align-items: center; flex-direction: column;
      font-family: 'Montserrat', sans-serif; height: 100vh; margin: -20px 0 50px;
    }

    h1 { font-weight: bold; margin: 0; }
    p { font-size: 14px; font-weight: 100; line-height: 20px; letter-spacing: 0.5px; margin: 20px 0 30px; }
    span { font-size: 12px; }
    a { color: #333; font-size: 14px; text-decoration: none; margin: 15px 0; }
    
    button {
      border-radius: 20px; border: 1px solid #4F46E5; background-color: #4F46E5; color: #FFFFFF;
      font-size: 12px; font-weight: bold; padding: 12px 45px; letter-spacing: 1px; text-transform: uppercase;
      transition: transform 80ms ease-in; cursor: pointer; margin-top: 10px;
    }
    button:active { transform: scale(0.95); }
    button:disabled { background-color: #a5b4fc; border-color: #a5b4fc; cursor: not-allowed; }
    button.ghost { background-color: transparent; border-color: #FFFFFF; margin-top: 0; }

    form {
      background-color: #FFFFFF; display: flex; align-items: center; justify-content: center;
      flex-direction: column; padding: 0 50px; height: 100%; text-align: center;
    }

    .input-group { width: 100%; margin: 8px 0; text-align: left; }
    
    input {
      background-color: #eee; border: 1px solid transparent; padding: 12px 15px; width: 100%;
      border-radius: 5px; outline: none; transition: all 0.2s;
    }
    input:focus { border-color: #4F46E5; background: white; }
    input.is-invalid { border-color: #ef4444; background: #fef2f2; }

    .invalid-feedback { color: #ef4444; font-size: 0.75rem; margin-top: 4px; padding-left: 5px; font-weight: 600; }

    .container {
      background-color: #fff; border-radius: 10px; box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
      position: relative; overflow: hidden; width: 768px; max-width: 100%; min-height: 550px; /* Increased height for extra fields */
    }

    .form-container { position: absolute; top: 0; height: 100%; transition: all 0.6s ease-in-out; }
    .sign-in-container { left: 0; width: 50%; z-index: 2; }
    .sign-up-container { left: 0; width: 50%; opacity: 0; z-index: 1; }

    .container.right-panel-active .sign-in-container { transform: translateX(100%); }
    .container.right-panel-active .sign-up-container { transform: translateX(100%); opacity: 1; z-index: 5; animation: show 0.6s; }

    @keyframes show { 0%, 49.99% { opacity: 0; z-index: 1; } 50%, 100% { opacity: 1; z-index: 5; } }

    .overlay-container { position: absolute; top: 0; left: 50%; width: 50%; height: 100%; overflow: hidden; transition: transform 0.6s ease-in-out; z-index: 100; }
    .container.right-panel-active .overlay-container { transform: translateX(-100%); }

    .overlay {
      background: linear-gradient(to right, #667eea, #764ba2); background-repeat: no-repeat;
      background-size: cover; background-position: 0 0; color: #FFFFFF; position: relative;
      left: -100%; height: 100%; width: 200%; transform: translateX(0); transition: transform 0.6s ease-in-out;
    }
    .container.right-panel-active .overlay { transform: translateX(50%); }

    .overlay-panel {
      position: absolute; display: flex; align-items: center; justify-content: center;
      flex-direction: column; padding: 0 40px; text-align: center; top: 0; height: 100%; width: 50%;
      transform: translateX(0); transition: transform 0.6s ease-in-out;
    }
    .overlay-left { transform: translateX(-20%); }
    .container.right-panel-active .overlay-left { transform: translateX(0); }
    .overlay-right { right: 0; transform: translateX(0); }
    .container.right-panel-active .overlay-right { transform: translateX(20%); }

    .social-container { margin: 20px 0; }
    .social-container a {
      border: 1px solid #DDDDDD; border-radius: 50%; display: inline-flex; justify-content: center;
      align-items: center; margin: 0 5px; height: 40px; width: 40px;
    }
    .error-msg { color: #e53e3e; margin-top: 10px; font-weight: bold; font-size: 0.8rem; }
  `]
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
