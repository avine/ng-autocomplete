import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AutocompleteModule } from 'autocomplete';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, AutocompleteModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
