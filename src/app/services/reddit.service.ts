import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from './data.service';

import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RedditService {

  public settings = {
    perPage: 10,
    subreddit: 'gifs',
    sort: '/hot'
  };

  private page: number = 1;
  private after: string;
  private moreCount: number = 0;

  public posts: any[] = [];
  public loading: boolean = false;

  constructor(private http: HttpClient, private dataService: DataService) { }

  Load(): void{
    this.dataService.getData().then(settings => {
      if(settings != null){
        this.settings = settings;
      }
      this.FetchData();
    });
  }

  FetchData(): void{
    //Build the URL.
    let url = "https://www.reddit.com/r/" + this.settings.subreddit + this.settings.sort + "/.json?limit=100";

    //Only grab post fromt he API that are after the last post we retrieved. (If we have done that yet)
    if(this.after){
      url += "&after=" + this.after;
    };

    this.loading = true;

    this.http
      .get(url)
      .pipe(
        //Return data in a friendly format.
        map((res: any) => {
          console.log(res);

          let response = res.data.children;
          let validPosts = 0;

          //Remove any posts that don't provide a GIF in a suitable format
          response = response.filter(post => {

            //If we've already retried enough posts for a page, we don't want anymore.
            if(validPosts >= this.settings.perPage){
              return false;
            }

            //Only want .gifv and .webm formats to convert them to .mp4.
            if(post.data.url.indexOf(".gifv") > -1 || post.data.url.indexOf(".webm") > -1){
              post.data.url = post.data.url.replace(".gifv", ".mp4");
              post.data.url = post.data.url.replace(".webm", ".mp4");

              //If a preview is available, assing it to the post as 'snapshot'
              if(typeof post.data.preview != "undefined"){
                post.data.snapshot = post.data.preview.images[0].source.url.replace(/&amp;/g, "&");
                //If the snapshot is undefined, chage to blank.
                if(post.data.snapshot == "undefined"){
                  post.data.snapshot == "";
                }
              }else{
                post.data.snapshot = "";
              }
              validPosts++;
              
              return true;
            }else{
              return false;
            }
          });
          
          //If we had enough valid posts, set that as "after." Otherwise just set the last post.
          if(validPosts >= this.settings.perPage){
            this.after = response[this.settings.perPage - 1].data.name;
          }else if(res.data.children.length > 0){
            this.after = res.data.children[res.data.children.length - 1].data.name;
            console.log(this.after);
          }
          return response;
        })
      )
      .subscribe(
        (data: any) => {
          console.log(data);

          //Add new posts we just pulled in to the existing posts
          this.posts.push(...data);

          //Keep fetching more GIFs if we didn't retrieve enough to fill a page.
          //Give up after 20 tries if we still don't have enough
          if(this.moreCount > 50){
            console.log("Giving up");
            //Give up.
            this.moreCount = 0;
            this.loading = false;
          }else{
            //If we don't have enough valid posts to fill a page, try fetching more data
            if(this.posts.length < this.settings.perPage * this.page){
              this.FetchData();
              this.moreCount++;
            }else{
              this.loading = false;
              this.moreCount = 0;
            }
          }
        },
        err => {
          console.log(err);
          //Fail silently, in this case the loading spinner will just continue to display
          console.log("Can't find data.");
        }
      )
  }

  NextPage(): void{
    this.page++;
    this.FetchData();
  }

  ResetPosts(): void{
    this.page = 1;
    this.posts = [];
    this.after = null;
    this.FetchData();
  }

  ChangeSubreddit(subreddit): void{
    this.settings.subreddit = subreddit;
    this.ResetPosts();
  }
}
