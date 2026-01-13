import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../api.service';

@Component({
    selector: 'app-security-demo',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './security-demo.component.html',
    styleUrls: ['./security-demo.component.scss']
})
export class SecurityDemoComponent {
    private api = inject(ApiService);

    insecureQuery = "";
    secureQuery = "";

    insecureResult: any[] | null = null;
    secureResult: any[] | null = null;

    get insecureJson() { return JSON.stringify(this.insecureResult, null, 2); }
    get secureJson() { return JSON.stringify(this.secureResult, null, 2); }

    testInsecure() {
        this.api.searchInsecure(this.insecureQuery).subscribe((res: any) => {
            this.insecureResult = res.data;
        });
    }

    testSecure() {
        this.api.searchSecure(this.secureQuery).subscribe((res: any) => {
            this.secureResult = res.data;
        });
    }
}
