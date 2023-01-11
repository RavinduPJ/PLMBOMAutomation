import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { LoginService } from "../login/login-service";

@Component({
    selector: 'layout',
    templateUrl: './layout-component.html',
    styleUrls: ['./layout-component.scss']
})

export class LayoutComponent implements OnInit {
    pageTitle: string
    currentUser: string
    userRole: string = "User"
    sideNavStatus: boolean
    copyrightYear: Date

    constructor(private cs: CookieService, private rt: Router, private ls: LoginService) {

    }

    ngOnInit(): void {
        this.currentUser = this.cs.get('userName');
        this.userRole = this.cs.get('role')
    }

    toggleSideNav(ts) {
        this.sideNavStatus = !this.sideNavStatus;
    }

    getType() : number {
        return parseInt(this.cs.get('type').trim())
    }

    logout() {
        this.ls.sysLogout()
            .subscribe(
                () => {
                    this.cs.deleteAll()
                   
                },
                (e) => {
                    alert('Error occurred during logout!')
                },
                () => {
                    this.rt.navigate(['/'])
                }
            )

    }


}