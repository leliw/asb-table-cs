import { Component, Input, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { Router } from '@angular/router';
import { Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

    @Input() credentials = { username: 'user', password: '' };
    error = false;

    constructor(private app: AppService, private router: Router) {
        app.authenticated = false;
    }
    ngOnInit(): void {
    }

    login() {
        console.log(this.credentials);
        this.app.authenticate(this.credentials, () => {
            this.router.navigateByUrl('/');
        });
        return false;
    }

}