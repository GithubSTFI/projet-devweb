import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

import { AuthLayoutComponent } from './components/auth-layout/auth-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardOverviewComponent } from './components/dashboard-overview/dashboard-overview.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AdminLogsComponent } from './components/admin-logs/admin-logs.component';
import { AdminTasksComponent } from './components/admin-tasks/admin-tasks.component';

// Guard as a function
export const authGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.isLoggedIn()) return true;
    router.navigate(['/auth']);
    return false;
};

// Admin Guard
export const adminGuard = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();
    if (user && user.role === 'ADMIN') return true;
    router.navigate(['/dashboard']);
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
            { path: 'files', component: FileListComponent },
            { path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] },
            { path: 'admin/tasks', component: AdminTasksComponent, canActivate: [adminGuard] },
            { path: 'admin/logs', component: AdminLogsComponent, canActivate: [adminGuard] }
        ]
    },
    { path: '**', redirectTo: 'auth' }
];
