import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate,  Router, RouterStateSnapshot } from "@angular/router";
import { CookieService } from "ngx-cookie-service";


@Injectable()
export class PreventInWithoutTokenService implements CanActivate {

    constructor(private rt: Router, private cs: CookieService) {

    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const exist = this.cs.check('token')
        console.log(exist)
        if (!exist) {
            this.rt.navigate(['/'])
        }
        return exist

    }
}

@Injectable()
export class PreventForNormalUsers implements CanActivate {
    constructor(private cs: CookieService, private rt: Router){

    }

    private getType() : number{
        return parseInt(this.cs.get('type').trim())
    }
 
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const tp = this.getType() == 1
        if(!tp){
            this.rt.navigate(['.'])
        }
        
        return tp
    }
}

@Injectable()
export class PreventForLowUsers implements CanActivate {
    constructor(private cs: CookieService, private rt: Router){

    }

    private getType() : number{
        return parseInt(this.cs.get('type').trim())
    }
 
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const tp = this.getType() == 1 || this.getType() == 2
        if(!tp){
            this.rt.navigate(['.'])
        }
        
        return tp
    }
}