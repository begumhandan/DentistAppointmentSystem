package com.dentist.appointment.repository;

import com.dentist.appointment.model.Appointment;
import com.dentist.appointment.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
}