package com.example.demo;

import java.security.Principal;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@GetMapping("/sso/user")
	@ResponseBody
	public Principal user(Principal user) {
		return user;
	}
	
	@Configuration
	@EnableWebSecurity
	protected static class SecurityConfiguration extends WebSecurityConfigurerAdapter {
		@Override
		protected void configure(HttpSecurity http) throws Exception {
			http.httpBasic()
			.and()
				.logout()
				.logoutUrl("/sso/logout")
			.and()
				.authorizeRequests()
					.antMatchers("/api/users", "/api/users/**").hasRole("ADMIN")
					.antMatchers("/api/**").authenticated()
				.anyRequest().permitAll()
			.and()
				.csrf()
				.ignoringAntMatchers ("/login","/logout")
				.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
		}
	}

	@Autowired
	private DataSource dataSource;
	
	@Bean
	UserDetailsManager users() {
	    JdbcUserDetailsManager users = new JdbcUserDetailsManager(dataSource);
	    return users;
	}
	
}
