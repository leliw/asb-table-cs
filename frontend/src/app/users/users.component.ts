import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { UsersDataSource, UsersItem } from './users-datasource';
import { UsersDialogComponent } from './users-dialog.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<UsersItem>;
  dataSource: UsersDataSource;

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

}
