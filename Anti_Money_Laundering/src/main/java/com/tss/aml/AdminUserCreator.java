package com.tss.aml;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * A simple, standalone class to insert an admin user with a hashed password.
 */
public class AdminUserCreator {

    // --- Database Configuration ---
    private static final String DB_URL = "jdbc:mysql://localhost:3306/aml";
    private static final String DB_USER = "root"; // Replace with your DB username
    private static final String DB_PASSWORD = "Fggv@676"; // Replace with your DB password

    public static void main(String[] args) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        // --- Admin User Details ---
        String adminEmail = "admin2@aml.com";
        String plainPassword = "admin123";
        String hashedPassword = passwordEncoder.encode(plainPassword);

        String sql = "INSERT INTO users (first_name, last_name, email, username, password, role, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            System.out.println("Connecting to database and creating admin user...");

            pstmt.setString(1, "Admin");
            pstmt.setString(2, "User");
            pstmt.setString(3, adminEmail);
            pstmt.setString(4, "admin_user"); // username
            pstmt.setString(5, hashedPassword);
            pstmt.setString(6, "ADMIN");
            pstmt.setBoolean(7, true);

            int rowsAffected = pstmt.executeUpdate();

            if (rowsAffected > 0) {
                System.out.println("Admin user created successfully with hashed password!");
            } else {
                System.out.println("Failed to create admin user.");
            }

        } catch (SQLException se) {
            // Handle errors for JDBC, e.g., user already exists
            if (se.getSQLState().equals("23000")) { // SQLSTATE for integrity constraint violation
                System.out.println("Admin user with email '" + adminEmail + "' may already exist.");
            } else {
                se.printStackTrace();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
