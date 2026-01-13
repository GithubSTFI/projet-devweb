import { Component, inject, OnInit, signal, AfterViewInit, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { Chart, registerables } from 'chart.js';
import { AuthService } from '../../auth.service';

Chart.register(...registerables);

@Component({
    selector: 'app-dashboard-overview',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard-overview.component.html',
    styleUrls: ['./dashboard-overview.component.scss'],
    animations: [
        trigger('staggerCards', [
            transition(':enter', [
                query('.stagger-item', [
                    style({ opacity: 0, transform: 'translateY(20px)' }),
                    stagger('100ms', [
                        animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('600ms ease-out', style({ opacity: 1 }))
            ])
        ])
    ]
})
export class DashboardOverviewComponent implements OnInit, AfterViewInit {
    private api = inject(ApiService);
    auth = inject(AuthService);
    today = new Date();

    stats = signal({ total: 0, todo: 0, inProgress: 0, done: 0, archived: 0 });
    recentTasks = signal<any[]>([]);

    @ViewChild('taskChart') taskChartRef!: ElementRef;
    chart: any;

    constructor() {
        effect(() => {
            const s = this.stats();
            if (this.chart) {
                this.updateChart(s);
            }
        });
    }

    ngOnInit() {
        this.loadStats();
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initChart();
        }, 300);
    }

    loadStats() {
        this.api.getStats().subscribe({
            next: (res: any) => {
                this.stats.set(res.stats);
                this.recentTasks.set(res.recentTasks);
            },
            error: (err) => console.error('Error loading stats', err)
        });
    }

    initChart() {
        if (!this.taskChartRef) return;
        const ctx = this.taskChartRef.nativeElement.getContext('2d');
        const s = this.stats();

        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['À faire', 'En cours', 'Terminées', 'Archivées'],
                datasets: [{
                    data: [s.todo, s.inProgress, s.done, s.archived],
                    backgroundColor: [
                        '#3b82f6', // Blue
                        '#10b981', // Green
                        '#f59e0b', // Amber
                        '#94a3b8'  // Gray
                    ],
                    borderWidth: 0,
                    hoverOffset: 15,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 25,
                            font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
                            color: '#64748b'
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    updateChart(stats: any) {
        if (this.chart) {
            this.chart.data.datasets[0].data = [
                stats.todo,
                stats.inProgress,
                stats.done,
                stats.archived
            ];
            this.chart.update();
        }
    }

    getStatusLabel(status: string): string {
        const labels: any = { 'TODO': 'À faire', 'IN_PROGRESS': 'En cours', 'DONE': 'Terminé', 'ARCHIVED': 'Archivé' };
        return labels[status] || status;
    }
}
