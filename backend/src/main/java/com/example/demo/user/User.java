package com.example.demo.user;

import java.util.Set;

import javax.persistence.CollectionTable;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.Table;

@Entity
@Table(name = "users")
public class User {
	@Id
	@Column(length = 50)
	public String username;
	@Column(length = 500)
	public String password;
	public Boolean enabled;
	@ElementCollection
	@CollectionTable(name = "authorities", joinColumns = @JoinColumn(name="username"))
	@Column(name = "authority")
	public Set<String> authorities;
}
