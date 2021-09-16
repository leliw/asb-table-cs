import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';


@Injectable()
export class AppService implements CanActivate {

    authenticated = null;
    roles = null;

    constructor(private http: HttpClient, private router: Router) {
        this.authenticate(null, null);
    }

    authenticate(credentials, callback) {

        const headers = new HttpHeaders(credentials ? {
            authorization: 'Basic ' + btoa(credentials.username + ':' + credentials.password)
        } : {});

        this.http.get(environment.ssoUrl + '/user', { headers: headers }).subscribe(response => {
            if (response && response['name']) {
                this.authenticated = true;
                this.roles = response['principal'].authorities.map((element) => {
                    return element.authority.substr(5); 
                });                
            } else {
                this.authenticated = false;
                this.roles = null;
            }
            console.log(this.authenticated);
            console.log(this.roles);
            return callback && callback();
        });

    }

    logout() {
        this.http.post(environment.ssoUrl + '/logout', {}).subscribe();
        this.authenticated = false;
        this.roles = null;
        console.log(this.authenticated);
    }

    hasRole(role: String) {
        return this.roles && this.roles.indexOf(role) !== -1;
    }
    
    hasAnyRole(roles: String[]) {
        return roles.filter(value => this.roles.includes(value)).length === 0
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this.roles) {
            if (route.data.role && this.hasRole(route.data.role)) {
                return true;
            } else {
                this.router.navigate(['/']);
                return false;
            }
        }
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}