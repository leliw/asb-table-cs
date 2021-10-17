import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { catchError, map } from 'rxjs/operators';
import { Observable, of as observableOf, merge, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EventEmitter } from '@angular/core';

// TODO: Replace this with your own data model type
export interface UsersItem {
  username: string;
  password: string;
  enabled: boolean;
  authorities: string[];
}


/**
 * Data source for the Users view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
 export class UsersDataSource extends DataSource<UsersItem> {
  data: UsersItem[] = [];
  paginator: MatPaginator | undefined;
  sort: MatSort | undefined;
  filter: string;
  filterChange = new EventEmitter<string>();
  
  apiUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {
    super()
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
   connect(): Observable<UsersItem[]> {
    if (this.paginator && this.sort) {
      // Combine everything that affects the rendered data into one update
      // stream for the data-table to consume.
      return merge(this.paginator.page, this.sort.sortChange, this.filterChange, 
        this.http.get<UsersItem[]>(this.apiUrl).pipe(map(data => this.data = data)))
        .pipe(map(() => {
          return this.getPagedData(this.getSortedData(this.getFilteredData([...this.data ])));
        }));
    } else {
      throw Error('Please set the paginator and sort on the data source before connecting.');
    }
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect(): void {}

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: UsersItem[]): UsersItem[] {
    if (this.paginator) {
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      return data.splice(startIndex, this.paginator.pageSize);
    } else {
      return data;
    }
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: UsersItem[]): UsersItem[] {
    if (!this.sort || !this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort?.direction === 'asc';
      switch (this.sort?.active) {
        case 'username': return compare(a.username, b.username, isAsc);
        case 'id': return compare(+a.enabled, +b.enabled, isAsc);
        default: return 0;
      }
    });
  }

  private getFilteredData(data: UsersItem[]): UsersItem[] {
    if (this.filter)
      return data.filter(user => 
        user.username.toLowerCase().includes(this.filter)
        );
    else
      return data;
  }

  public getItem(id: number): Observable<UsersItem> {
    return this.http.get<UsersItem>(this.apiUrl + '/' + id);
  }

  public addItem(newItem: UsersItem) {
    if (newItem.enabled === undefined)
      newItem.enabled = false;
    console.log(newItem);
    return this.http.post<UsersItem>(this.apiUrl, newItem)
      .pipe(
        catchError(this.handleError),
        map((savedItem) => {
          this.data.push(savedItem);
          this.paginator.page.emit();
        })
      );
  }

  public updateItem(updatedItem: UsersItem): Observable<void> {
    console.log(updatedItem);
    return this.http.put<UsersItem>(this.apiUrl + '/' + updatedItem.username, updatedItem)
      .pipe(
        catchError(this.handleError),
        map((savedItem) => {
          this.data = this.data.filter((value, key) => {
            if(value.username == savedItem.username) {
              value.enabled = savedItem.enabled;
              value.password = savedItem.password;
              value.authorities = savedItem.authorities;
              this.paginator.page.emit();
            }
            return true;
          })
        }
        )
      );
  }

  deleteItem(deletedItem: UsersItem): Observable<void> {
    return this.http.delete(this.apiUrl + '/' + deletedItem.username)
      .pipe(
        catchError(this.handleError),
        map(() => {
          this.data = this.data.filter((value) => {
            return value.username != deletedItem.username;
          });
          this.paginator.page.emit();
        })
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // Return an observable with a user-facing error message.
    return throwError(
      'Something bad happened; please try again later.');
  }
}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: string | number, b: string | number, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
