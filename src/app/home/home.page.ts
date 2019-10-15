import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormGroup, FormControl } from '@angular/forms';
import { DataService } from '../services/data.service';
import { RedditService } from '../services/reddit.service';
import { Plugins } from '@capacitor/core';

import { SettingsPage } from "../settings/settings.page";

import { debounceTime } from 'rxjs/operators';
import { distinctUntilChanged } from 'rxjs/operators';

const { Browser, Keyboard } = Plugins;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  public subredditForm: FormGroup;

  constructor(private dataService: DataService, public redditService: RedditService, private modalCtrl: ModalController) {
    this.subredditForm = new FormGroup({
      subredditControl: new FormControl("")
    });
  }

  ngOnInit(){
    this.redditService.Load();

    this.subredditForm.get("subredditControl")
    .valueChanges.pipe(
      debounceTime(1500),
      distinctUntilChanged()
    ).subscribe((subreddit: any) =>{
      if(subreddit.length > 0){
        this.redditService.ChangeSubreddit(subreddit);
        Keyboard.hide().catch(err => {
          console.warn(err);
        });
      }
    });
  }

  ShowComments(post): void{
    Browser.open({
      toolbarColor: "#fff",
      url: "http://reddit.com" + post.data.permalink, 
      windowName: "_system"
    });
  }

  OpenSettings(): void{
    this.modalCtrl.create({
      component: SettingsPage
    }).then(modal => {
      modal.onDidDismiss().then(() => {
        this.redditService.ResetPosts();
      });
      modal.present();
    });
  }

  PlayVideo(e, post): void{
    console.log(e);

    //Create a reference to the video.
    let video = e.target;

    //Toggle the video playing
    if(video.paused){
      //Show the loader gif
      video.play();

      video.addEventListener("playing", e => {
        console.log("Playing video.");
      });
    }else{
      video.pause();
    }
  }

  LoadMore(): void{
    this.redditService.Load();
  }
}

