package com.dentist.appointment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AppointmentApplication {

	public static void main(String[] args) {

		// Herhangi bir main metodunda veya küçük bir test sınıfında
		System.out.println(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode("123456"));
		SpringApplication.run(AppointmentApplication.class, args);
	}

}
