package com.example.demo.user;

@SuppressWarnings("serial")
public class UserNotFoundException extends Exception {
	public UserNotFoundException(String username) {
		super("Could not find User " + username);
	}
}