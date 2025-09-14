package com.xeno.crm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CrmXenoApplication {

	public static void main(String[] args) {
		SpringApplication.run(CrmXenoApplication.class, args);
	}

}
