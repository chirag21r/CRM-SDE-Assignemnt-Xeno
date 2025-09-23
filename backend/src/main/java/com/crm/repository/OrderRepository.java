package com.crm.repository;

import com.crm.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("select coalesce(sum(o.amount), 0.0) from Order o")
    Double sumAmount();
}


