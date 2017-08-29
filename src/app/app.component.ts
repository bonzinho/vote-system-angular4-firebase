import { Component } from '@angular/core';
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import * as firebase from 'firebase/app';
import { AuthService } from './services/auth.service';
import 'rxjs/add/operator/map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  items: FirebaseListObservable<any[]>;
  user = null;
  vote = false;

  constructor(public af: AngularFireDatabase, public afAuth: AuthService) {}

  ngOnInit() {
    this.afAuth.getAuthState().subscribe((user) => this.user = user);
    this.items = this.af.list('/courses', {
      query: {
        orderByChild: 'votes'
      }
    });
    this.items.map(items => {
      items.sort((a: any, b: any) => {
        return a.votes > b.votes;
      });
      return items.reverse();
    });
  }

  create(e: any, value: string) {
    e.preventDefault();
    let emails = [
        this.user.email,
    ];

    let data = {
      title: value,
      color: this.getColor(),
      users: emails,
      votes: 1,
    };

    this.items.push(data);
  }

  update(key: string) {
    let obj = this.af.object('/courses/' + key);
    obj.$ref.transaction(item => {
      let emails = item.users || [];
      // verifica o email logado já existe na votação, caso exista sai fora (return), isto para prevenir a votação repetida
      this.vote = true;
      if (emails.indexOf(this.user.email) >= 0) {
        return;
      }

      let total: number = item.votes || 0;
      total ++;
      emails.push(this.user.email);
      this.items.update(key, {votes: total, users: emails});
    });
  }

  remove(key: string) {
    this.user != null  ? this.items.remove(key) : this.user = null;
  }

  disVote(key: string) {
    let obj  = this.af.object('/courses/' + key);
    obj.$ref.transaction( item => {
      let totalVotes: number = item.votes || 0;
      if (totalVotes > 0) {
        totalVotes --;
        this.items.update(key, {votes: totalVotes, users: null });
        this.vote = false;
      }else {
        return;
      }
    });
  }

  private getColor() {
    const colors = [
      'green',
      'blue',
      'red',
      'purple',
      'orange',
      'pink'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }


  login() {
    this.afAuth.loginWithGoogle();
  }

  logout() {
   this.afAuth.logout();
  }

  isLoggedIn() {
    return this.afAuth.isLoggedIn();
  }
}
