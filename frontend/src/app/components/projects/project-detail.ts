// Project Detail Component
import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProjectService, Project } from '../../project.service';
import { ApiService, Task } from '../../api.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../toast/toast.component';
import { FilterStatusPipe } from '../../filter-status.pipe';
import { TaskDetailComponent } from '../task-detail/task-detail.component';

@Component({
    selector: 'app-project-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, FilterStatusPipe, TaskDetailComponent],
    templateUrl: './project-detail.html',
    styleUrls: ['./project-detail.scss'],
    animations: [
        trigger('fadeSlide', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ])
    ]
})
export class ProjectDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private projectService = inject(ProjectService);
    private api = inject(ApiService);
    private toast = inject(ToastService);
    private router = inject(Router);

    project = signal<Project | null>(null);
    tasks = signal<Task[]>([]);
    isLoading = signal(true);

    showInviteModal = signal(false);
    inviteEmail = signal('');
    inviteRole = signal('MEMBER');
    isEmailValid = computed(() => {
        const email = this.inviteEmail();
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(email);
    });

    // Task Management
    showTaskModal = signal(false);
    isNewTask = signal(false);
    selectedTask = signal<Partial<Task>>({});

    projectId = 0;

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.projectId = +params['id'];
            if (this.projectId) {
                this.loadProject();
                this.loadTasks();
            }
        });
    }

    loadProject() {
        this.projectService.getProjectDetails(this.projectId).subscribe({
            next: (res) => this.project.set(res.data),
            error: () => this.router.navigate(['/dashboard/projects'])
        });
    }

    loadTasks() {
        this.isLoading.set(true);
        // getTasks signature: (status, priority, q, page, limit)
        // We need to pass projectId. I updated ApiService to handle this? No, wait.
        // I need to update ApiService.getTasks to support projectId.
        this.api.getTasks('all', 'all', '', 1, 50, this.projectId).subscribe({
            next: (res) => {
                this.tasks.set(res.data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    sendInvite() {
        if (!this.isEmailValid()) {
            this.toast.show('Veuillez entrer une adresse email valide', 'info');
            return;
        }
        this.projectService.inviteMember(this.projectId, this.inviteEmail(), this.inviteRole()).subscribe({
            next: () => {
                this.toast.show('Invitation envoyée !', 'success');
                this.showInviteModal.set(false);
                this.inviteEmail.set('');
                this.loadProject(); // Reload for invitation list
            },
            error: (err: any) => this.toast.show(err.error?.error || 'Erreur d\'envoi', 'error')
        });
    }

    // Task Handlers
    openAddTask() {
        this.selectedTask.set({ priority: 'MEDIUM', status: 'TODO', projectId: this.projectId });
        this.isNewTask.set(true);
        this.showTaskModal.set(true);
    }

    openEditTask(task: Task) {
        this.selectedTask.set(task);
        this.isNewTask.set(false);
        this.showTaskModal.set(true);
    }

    closeTaskModal() {
        this.showTaskModal.set(false);
    }

    onTaskUpdated() {
        this.loadTasks();
        this.toast.show('Tableau mis à jour', 'success');
    }

    getInitials(name: string | undefined): string {
        if (!name) return '?';
        return name.split(' ')
            .filter(n => n.length > 0)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'TODO': return '#94a3b8';
            case 'IN_PROGRESS': return '#6366f1';
            case 'DONE': return '#10b981';
            default: return '#94a3b8';
        }
    }
}
