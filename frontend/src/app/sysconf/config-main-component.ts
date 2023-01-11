import { Component } from "@angular/core";
import { CookieService } from "ngx-cookie-service";

@Component({
    selector: 'conf-main',
    templateUrl: './config-main-component.html',
    styleUrls: ['./config-main-component.css']
})

export class ConfigMainComponent {
    constructor(private cs: CookieService){

    }

    getType(): number {
        return parseInt(this.cs.get('type').trim())
    }

}