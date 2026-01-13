import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { FileListComponent } from './components/file-list/file-list.component';

// Guard as a function
export const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        return true;
    }

    // Redirect to auth if not logged in
    router.navigate(['/auth']);
    return false;
};

// Redirect logged in users away from auth page
export const guestGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
};

export const routes: Routes = [
    { path: '', redirectTo: 'auth', pathMatch: 'full' },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        canActivate: [guestGuard]
    },
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: DashboardOverviewComponent },
            { path: 'tasks', component: TaskListComponent },
            { path: 'files', component: FileListComponent }
        ]
    },
    { path: '**', redirectTo: 'auth' }
];
