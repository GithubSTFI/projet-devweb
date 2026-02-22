import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AuthService } from '../../auth.service';
import { ProjectService, Project } from '../../project.service';
import { LoaderComponent } from '../loader/loader.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard-overview',
    standalone: true,
    imports: [CommonModule, RouterModule, LoaderComponent],
    templateUrl: './dashboard-overview.component.html',
    styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit, AfterViewInit {
    private api = inject(ApiService);
    private authService = inject(AuthService);
    private projectService = inject(ProjectService);

    user = this.authService.currentUser;
    stats = signal<any>(null);
    recentTasks = signal<any[]>([]);
    recentActivities = signal<any[]>([]);
    projects = signal<Project[]>([]);
    role = signal<'ADMIN' | 'USER' | null>(null);
    isLoading = signal<boolean>(false);
    chart: any;

    @ViewChild('taskChart') taskChartRef!: ElementRef;

    ngOnInit() {
        this.loadStats();
    }

    ngAfterViewInit() {
        // Le graphique sera initialisé quand les stats seront chargées
    }

    loadStats() {
        this.isLoading.set(true);
        this.api.getStats().subscribe({
            next: (response: any) => {
                this.role.set(response.role);
                this.stats.set(response.stats);

                if (response.role === 'ADMIN') {
                    this.recentActivities.set(response.recentActivities);
                    setTimeout(() => this.initChart(), 300);
                } else {
                    this.recentTasks.set(response.recentTasks);
                    setTimeout(() => this.initChart(), 300);
                }
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading stats', err);
                this.isLoading.set(false);
            }
        });

        this.projectService.getMyProjects().subscribe({
            next: (res) => {
                console.log('DEBUG DASHBOARD PROJECTS:', res.data);
                this.projects.set(res.data);
            },
            error: (err) => console.error(err)
        });
    }

    getTaskStats(project: any): string {
        const tasks = this.getProjectsTasks(project);
        if (tasks.length === 0) return '0/0';
        const done = tasks.filter((t: any) => t.status === 'DONE').length;
        return `${done}/${tasks.length}`;
    }

    getProjectsTasks(project: any): any[] {
        return project.tasks || project.Tasks || [];
    }

    initChart() {
        if (!this.taskChartRef) return;
        const ctx = this.taskChartRef.nativeElement.getContext('2d');
        const s = this.stats();

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['À faire', 'En cours', 'Terminées'],
                datasets: [{
                    data: [s.todo || 0, s.inProgress || 0, s.done || 0],
                    backgroundColor: ['#f59e0b', '#6366f1', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 12,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { family: 'Inter', size: 12, weight: 'bold' },
                            color: '#94a3b8'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Inter', size: 13 },
                        bodyFont: { family: 'Inter', size: 13 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true
                    }
                }
            }
        });
    }

    getCountByStatus(status: string): number {
        if (!this.stats()) return 0;
        const s = this.stats();
        if (status === 'TODO') return s.todo || 0;
        if (status === 'IN_PROGRESS') return s.inProgress || 0;
        if (status === 'DONE') return s.done || 0;
        return 0;
    }

    formatDate(date: string): string {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / 3600000);

        if (hours < 1) return 'À l\'instant';
        if (hours < 24) return `Il y a ${hours}h`;
        if (hours < 48) return 'Hier';
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
}
