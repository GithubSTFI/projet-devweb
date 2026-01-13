import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-async-demo',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './async-demo.component.html',
    styleUrls: ['./async-demo.component.scss']
})
export class AsyncDemoComponent {
    private api = inject(ApiService);
    loading = false;
    log: string[] = [];

    startTask() {
        this.loading = true;
        this.log.push(`[${new Date().toLocaleTimeString()}] Demande envoyée...`);

        this.api.startAsyncTask().subscribe({
            next: (res: any) => {
                this.log.push(`[${new Date().toLocaleTimeString()}] Serveur a accepté : ${res.message}`);

                // Simulate waiting
                this.log.push(`[${new Date().toLocaleTimeString()}] En attente des résultats...`);
                setTimeout(() => {
                    this.loading = false;
                    this.log.push(`[${new Date().toLocaleTimeString()}] Processus terminé ! (Simulé)`);
                }, 5000);
            },
            error: (err: any) => {
                this.loading = false;
                this.log.push(`[ERREUR] Échec du lancement.`);
            }
        });
    }
}
