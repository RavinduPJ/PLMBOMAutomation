import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { LoginService } from "./login-service";

@Component({
    selector: 'login',
    templateUrl: './login-component.html',
    styleUrls: ['./login-component.scss']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup
    userName: FormControl
    password: FormControl
    loginSuccess: boolean

    loginProgress : boolean = false

    errString: string = "Invalid Username or Password"

    constructor(private cs: CookieService, private r: Router, private ls: LoginService) {

    }

    ngOnInit(): void {
        this.userName = new FormControl('', Validators.required)
        this.password = new FormControl('', Validators.required)
        this.loginForm = new FormGroup({
            userName: this.userName,
            password: this.password

        })
        this.loginSuccess = true
    }

    login(vals) {
        if (this.loginForm.valid) {
            /*this.cs.set('loggedIn', 'true')
            this.cs.set('userName', vals.userName)
            this.cs.set('role', 'Admin')
            this.r.navigate(['/tool/b'])*/
            this.loginProgress = true
            this.ls.sysLogin(vals.userName, vals.password).subscribe(
                ok => {
                    console.log(ok)
                    this.loginSuccess = true
                    this.cs.set('userName', ok.userName)
                    this.cs.set('loggedIn', 'true')
                    this.cs.set('token', ok.token)
                    this.cs.set('uid', ok.user_id)
                    this.cs.set('role', ok.role)
                    this.cs.set('type', String(ok.type))

                }, err => {
                    console.log(err)
                    this.errString = err
                    this.loginSuccess = false
                    this.loginProgress = false

                }, () => {
                    this.loginProgress = false
                    if (this.loginSuccess) {
                        this.r.navigate(['/tool/b'])
                    }
                }
            )
        }
    }
}