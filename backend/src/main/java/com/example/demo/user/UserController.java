package com.example.demo.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
	@Autowired
	private UserRepository repository;

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

	@DeleteMapping("/api/users/{username}")
	public void delete(@PathVariable String username) {
		repository.deleteById(username);
	}
}
