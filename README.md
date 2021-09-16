# Angular - Spring Boot - Table - Client Side

In this project we implement table and CRUD features with sorting and filtering on client side.
This solution is applicable rather for small data sets because always all data set is loaded from server.
Lists of system users are usualy not big, so it's good example for this attempt.


Let's start with the previous project.
```bash
curl -L https://github.com/leliw/asb-roles/archive/refs/heads/main.zip -o main.zip
unzip main.zip
mv asb-roles-main asb-table-cs
cd asb-table-cs
# Start VS Code for developing frontend
code frontend &
# Start Eclipse fro developing backend
/c/Program\ Files/eclipse/jee-2021-03/eclipse -import backend -build backend &
```

If you use eclipse as Java IDE, import backend folder as *Existing Maven project*.


## Backend

There is allready a method returnig the whole list of users. Let's add all CRUD methods in UserController.java file.

```java
	@GetMapping("/api/users/{username}")
	public User one(@PathVariable String username) throws Exception {
		return this.repository.findById(username)
				.orElseThrow(() -> new UserNotFoundException(username));
	}
	
	@PostMapping("/api/users")
	public User newOne(@RequestBody User item) {
		return this.repository.save(item);
	}
	
	@PutMapping("/api/users/{username}")
	public User replace(@RequestBody User newItem, @PathVariable String username)
			throws Exception {
		return repository.findById(username).map(item -> {
			item.password = newItem.password;
			item.enabled = newItem.enabled;
			item.authorities = newItem.authorities;
			return repository.save(item);
		}).orElseGet(() -> {
			newItem.username = username;
			return repository.save(newItem);
		});
	}
	
	@DeleteMapping("/api/users/{username}")
	public void delete(@PathVariable String username) {
		repository.deleteById(username);
	}
```
And exception class.
```java
package com.example.demo.user;

@SuppressWarnings("serial")
public class UserNotFoundException extends Exception {
	public UserNotFoundException(String username) {
		super("Could not find User " + username);
	}
}
```

Of course there is a problem with password field, but we will back later. 

User role validation is allready done in *BackendApplication.java* - only ADMIN role can view and modify users.
```java
...
			.and()
				.authorizeRequests()
					.antMatchers("/api/users", "/api/users/**").hasRole("ADMIN")
					.antMatchers("/api/**").authenticated()
...
```

## Frontend

First delete existing component and then create a new one. After that restart Angular server.

```bash
$ rm -R src/app/users
$ ng generate @angular/material:table users
```
When you login as admin you see default table component.

### Datasource

Add user fields definition:
```typescript
export interface UsersItem {
  username: string;
  password: string;
  enabled: boolean;
  authorities: string[];
}
```

Remove example data, add HttpClient dependency and define backend URL.
```typescript
export class UsersDataSource extends DataSource<UsersItem> {
  data: UsersItem[] = [];
  paginator: MatPaginator | undefined;
  sort: MatSort | undefined;

  apiUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {
    super()
  }
```

All users will be loaded in connect method.
```typescript
  connect(): Observable<UsersItem[]> {
    if (this.paginator && this.sort) {
      // Combine everything that affects the rendered data into one update
      // stream for the data-table to consume.
      return merge(this.paginator.page, this.sort.sortChange,
        this.http.get<UsersItem[]>(this.apiUrl).pipe(map(data => this.data = data)))
        .pipe(map(() => {
          return this.getPagedData(this.getSortedData([...this.data ]));
        }));
    } else {
      throw Error('Please set the paginator and sort on the data source before connecting.');
    }
  }
```

And correct getSortedData method with user fields.
```typescript
    return data.sort((a, b) => {
      const isAsc = this.sort?.direction === 'asc';
      switch (this.sort?.active) {
        case 'username': return compare(a.username, b.username, isAsc);
        case 'id': return compare(+a.enabled, +b.enabled, isAsc);
        default: return 0;
      }
    });
```

Then modify *users.component.ts* with user fields and add HttpClient injection.
```typescript
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['username', 'enabled', 'password', 'authorities'];

  constructor(private http: HttpClient) {
    this.dataSource = new UsersDataSource(http);
  }
```

### View - html

Let's update user fields again. This time in HTML template (*users.component.html*).

```html
<div class="mat-elevation-z8">
  <table mat-table class="full-width-table" matSort aria-label="Elements">
    <ng-container matColumnDef="username">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Username</th>
      <td mat-cell *matCellDef="let row">{{row.username}}</td>
    </ng-container>

    <ng-container matColumnDef="enabled">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Enabled</th>
      <td mat-cell *matCellDef="let row">{{row.enabled}}</td>
    </ng-container>

    <ng-container matColumnDef="password">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Password</th>
      <td mat-cell *matCellDef="let row">{{row.password}}</td>
    </ng-container>

    <ng-container matColumnDef="authorities">
      <th mat-header-cell *matHeaderCellDef mat-sort-header>Authorities</th>
      <td mat-cell *matCellDef="let row">{{row.authorities}}</td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>

  <mat-paginator #paginator
      [length]="dataSource?.data?.length"
      [pageIndex]="0"
      [pageSize]="10"
      [pageSizeOptions]="[5, 10, 20]">
  </mat-paginator>
</div>
```

Now check the result - login as admin. Sorting by username works!

### CRUD - dataSource

Let's add the rest of CRUD methods in *users-datasource.ts*.

```typescript
  public getItem(id: number): Observable<UsersItem> {
    return this.http.get<UsersItem>(this.apiUrl + '/' + id);
  }

  public addItem(newItem) {
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

  public updateItem(updatedItem): Observable<void> {
    console.log(updatedItem);
    return this.http.put<UsersItem>(this.apiUrl + '/' + updatedItem.id, updatedItem)
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

  deleteItem(deletedItem): Observable<void> {
    return this.http.delete(this.apiUrl + '/' + deletedItem.id)
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

```

And error handling in the same class.
```typescript
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
```

### CRUD - dialog box

Add extra column at the end in html table.
```html
    <ng-container matColumnDef="actions">
      <th mat-header-cell *matHeaderCellDef>Actions
        <button mat-icon-button matTooltip="Click to Edit" class="iconbutton" color="primary" (click)="openDialog('Add', {})">
          <mat-icon aria-label="Add">add</mat-icon>
        </button>      
      </th>
      <td mat-cell *matCellDef="let row">
        <button mat-icon-button matTooltip="Click to Edit" class="iconbutton" color="primary" (click)="openDialog('Update', row)">
          <mat-icon aria-label="Edit">edit</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Click to Delete" class="iconbutton" color="warn" (click)="openDialog('Delete', row)">
          <mat-icon aria-label="Delete">delete</mat-icon>
        </button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
  </table>	
```

And "actions" column in *users-component.ts*.
```typescript
	displayedColumns = ['username', 'enabled', 'password', 'authorities', 'actions'];
```

Generate a new dialog component.
```bash
$ ng generate component users/users-dialog --flat
```

Modify *users-component.ts* and add import MatDialogModule in *app.module.ts*.
```typescript
  /** Columns displayed in the table. Columns IDs can be added, removed, or reordered. */
  displayedColumns = ['username', 'enabled', 'password', 'authorities', 'actions'];

  constructor(private http: HttpClient, public dialog: MatDialog) {
    this.dataSource = new UsersDataSource(http);
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.table.dataSource = this.dataSource;
  }

  openDialog(action: string, obj) {
    obj.action = action;
    const dialogRef = this.dialog.open(UsersDialogComponent, {
      data:obj
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.event == 'Add'){
        this.dataSource.addItem(result.data).subscribe();
      }else if(result.event == 'Update'){
        this.dataSource.updateItem(result.data).subscribe();
      }else if(result.event == 'Delete'){
        this.dataSource.deleteItem(result.data).subscribe();
      }
    });
  }
```

Modify HTML template of users dialog (*users-dialog.component.html*) and the component (*users-dialog.component.ts*).
```html
<h1 mat-dialog-title>Row Action :: <strong>{{action}}</strong></h1>
<div mat-dialog-content class="dialog" style="width: 400px;">
    <ng-tmplate *ngIf="action != 'Delete'; else elseTemplate">
        <div class="row">
            <div class="col">
                <mat-form-field [style.width.%]="100">
                    <input placeholder="Username" matInput [(ngModel)]="local_data.username" autocomplete="disabled">
                </mat-form-field>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <mat-form-field [style.width.%]="100">
                    <input [type]="hide ? 'password' : 'text'" placeholder="Password" matInput [(ngModel)]="local_data.password" autocomplete="new-password">
                    <mat-icon matSuffix (click)="hide = !hide">{{hide ? 'visibility_off' : 'visibility'}}</mat-icon>
                </mat-form-field>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <mat-slide-toggle matInput [(ngModel)]="local_data.enabled" style="padding-bottom: 1.25em;">Enabled
                </mat-slide-toggle>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <mat-form-field [style.width.%]="100" appearance="fill">
                    <mat-label>Authorities</mat-label>
                    <mat-select matInput [(ngModel)]="local_data.authorities" multiple>
                        <mat-option value="ROLE_USER">User</mat-option>
                        <mat-option value="ROLE_ADMIN">Admin</mat-option>
                    </mat-select>
                </mat-form-field>
            </div>
        </div>
    </ng-tmplate>
    <ng-template #elseTemplate>
        Sure to delete <b>{{local_data.username}}</b>?
    </ng-template>
</div>
<div mat-dialog-actions style="justify-content: flex-end;">
    <button mat-button (click)="doAction()" mat-flat-button color="primary">{{action}}</button>
    <button mat-button (click)="closeDialog()" mat-flat-button color="warn">Cancel</button>
</div>
```

```typscript
export class UsersDialogComponent {

  action:string;
  local_data:any;
  hide = true; 

  constructor(
    public dialogRef: MatDialogRef<UsersDialogComponent>,
    //@Optional() is used to prevent error if no data is passed
    @Optional() @Inject(MAT_DIALOG_DATA) public data: UsersItem) {
    console.log(data);
    this.local_data = {...data};
    this.action = this.local_data.action;
    delete this.local_data.action;
  }

  doAction(){
    this.dialogRef.close({event:this.action,data:this.local_data});
  }

  closeDialog(){
    this.dialogRef.close({event:'Cancel'});
  }

}
```

Add used in dialog template modulese in *app.module.ts*.
```typescript
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
```

Maybe after this change you will have to restat ng server.
```bash
$ ps
$ # Get PID for nodejs and insert below
$ kill PID
$ ng serve &
```

## Minor improvements in backend

Everythig above is enough to implement simple CRUD. But in this case we use it to manage users, so some improvements are needed. Now backed always returns all user properties also encoded password. It shouldn't be sent to client. So let's remove it.
```java
	@GetMapping("/api/users")
	public @ResponseBody Iterable<User> getAll() {
		Iterable<User> ret = repository.findAll();
		for (User user : ret)
			user.password = null;
		return ret;
	}

	@GetMapping("/api/users/{username}")
	public User one(@PathVariable String username) throws Exception {
		User ret = this.repository.findById(username)
				.orElseThrow(() -> new UserNotFoundException(username));
		ret.password = null;
		return ret;
	}
```

When user sets password it should be encoded.
```java
	private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
	
	@PostMapping("/api/users")
	public User newOne(@RequestBody User item) {
		if (item.password != null)
			item.password = "{bcrypt}" + this.encoder.encode(item.password);
		User ret = this.repository.save(item);
		ret.password = null;
		return ret;
	}
	
	@PutMapping("/api/users/{username}")
	public User replace(@RequestBody User newItem, @PathVariable String username)
			throws Exception {
		return repository.findById(username).map(item -> {
			if (newItem.password != null)
				item.password = "{bcrypt}" + this.encoder.encode(newItem.password);
			if (newItem.enabled != null)
				item.enabled = newItem.enabled;
			if (newItem.authorities != null)
				item.authorities = newItem.authorities;
			User ret = repository.save(item);		
			ret.password = null;
			return ret;
		}).orElseGet(() -> {
			newItem.username = username;
			User ret = repository.save(newItem);
			ret.password = null;
			return ret;
		});
	}	
```

So far we used in memory H2 database. Let's change it to postgres.

Start postgres server in docker.
```bash
$ docker run --name asb-postgres -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```

In pom.xml replace:
```xml
		<dependency>
			<groupId>com.h2database</groupId>
			<artifactId>h2</artifactId>
			<scope>runtime</scope>
		</dependency>	
```
with:
```xml
		<dependency>
			<groupId>org.postgresql</groupId>
			<artifactId>postgresql</artifactId>
			<scope>runtime</scope>
		</dependency>
```

Add connection properties in application.properties
```properties
spring.datasource.url = jdbc:postgresql://localhost:5432/postgres
spring.datasource.username = postgres
spring.datasource.password = mysecretpassword

spring.sql.init.enabled = true
spring.sql.init.platform = postgresql
spring.sql.init.continue-on-error = true
```

The last two lines are needed for automatic creation database with SQL scripts which are located in *src/main/resources/* folder.

schema-postgresql.sql:
```sql
create table users(
    username varchar(50) not null primary key,
    password varchar(500) not null,
    enabled boolean not null
);

create table authorities (
    username varchar(50) not null,
    authority varchar(50) not null,
    constraint fk_authorities_users foreign key(username) references users(username)
);
create unique index ix_auth_username on authorities (username,authority);
```

data-postgresql.sql:
```sql
insert into users(username, password, enabled) values ('user', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', true);
insert into authorities(username, authority) values ('user', 'ROLE_USER');
insert into users(username, password, enabled) values ('admin', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', true);
insert into authorities(username, authority) values ('admin', 'ROLE_USER');
insert into authorities(username, authority) values ('admin', 'ROLE_ADMIN');
```

Now initial users are created by the SQL script, so remove it from java code and add autowired datasource
```java
	@Autowired
	private DataSource dataSource;
	
	@Bean
	UserDetailsManager users() {
	    JdbcUserDetailsManager users = new JdbcUserDetailsManager(dataSource);
	    return users;
	}
```
References:
1. https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.using-basic-sql-scripts








