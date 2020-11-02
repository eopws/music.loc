<?php

/*
 * This class controls a database and allows you to communicate with the database
 * */
final class Database
{
    // Database class object. This object is the only instance of the Database class
    private static $DB_instance;

    // PDO object
    private $pdo;

    // cached prepared statements
    private $prepared_statements = [];

    /*
     * Database configuration
     * */
    private $DB_name      = 'best_music';
    private $DB_login     = 'root';
    private $DB_password  = 'root';
    private $DB_host      = '127.0.0.1';

    /*
     * Private constructor made because of there can only be one instance of Database class
     *
     * @return void
     * */
    private function __construct() {
        try {
            $this->pdo = new PDO('mysql:host=' . $this->DB_host . ';dbname=' . $this->DB_name,
                $this->DB_login,
                $this->DB_password);

            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            die('Unfortunately error occurred. Don\'t worry, developers will know about that soon');
        }
    }

    /*
     * Executes SQL query. Returns true if success, false otherwise.
     *
     * @var string $query_string - SQL query string
     * @var array $parameters - SQL query variables
     * @return bool - true if success, false on error
     * */
    public function query($query_string, $parameters = []): bool {
        try {
            if ( !$this->prepared_statements[$query_string] ) {
                $this->prepared_statements[$query_string] = $this->pdo->prepare($query_string);
            }

            $query = $this->prepared_statements[$query_string];
            $query->execute($parameters);

            return true;
        } catch (PDOException $e) {
            return false;
        }
    }

    /*
     * Use this method if you wanna insert values to a table
     * It's convenient for populating related tables
     * Returns id of new row if success, 0 otherwise
     *
     * @var string $insert_query - SQL query string
     * @var array $parameters - SQL query variables
     * @return int - new row ID if success -1 otherwise
     * */
    public function insert($insert_query, $parameters = []):int {
        try {
            if ( !$this->prepared_statements[$insert_query] ) {
                $this->prepared_statements[$insert_query] = $this->pdo->prepare($insert_query);
            }

            $query = $this->prepared_statements[$insert_query];
            $query->execute($parameters);

           return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            return -1;
        }
    }

    /*
     * Executes a database query and returns array of results. If error returns array of one element false
     * If nothing found return array of one element 'empty'
     *
     * @var string $query_string - SQL query
     * @var array $parameters - SQL query variables
     * @return array - array of results
     * */
    public function get_results($query_string, $parameters = []): array {
        try {
            if ( !$this->prepared_statements[$query_string] ) {
                $this->prepared_statements[$query_string] = $this->pdo->prepare($query_string);
            }

            $query = $this->prepared_statements[$query_string];
            $query->execute($parameters);

            $query_results = $query->fetchAll(PDO::FETCH_ASSOC);
            return empty($query_results) ? ['empty'] : $query_results;
        } catch (PDOException $e) {
            return [false];
        }
    }

    /*
     * This method provides access to Database object
     *
     * @return Database - Database object instance
     * */
    public static function get_db_object(): Database {
        if ( !Database::$DB_instance ) {
            Database::$DB_instance = new Database();
        }

        return Database::$DB_instance;
    }
}