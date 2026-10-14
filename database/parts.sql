USE `wms-system-toho`;

CREATE TABLE IF NOT EXISTS parts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_number VARCHAR(80) NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    location_id INT NOT NULL,
    `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_parts_part_number (part_number),
    KEY ix_parts_location_id (location_id),
    KEY ix_parts_timestamp (`timestamp`),
    CONSTRAINT fk_parts_location FOREIGN KEY (location_id) REFERENCES locations(id)
);

INSERT INTO locations (location_code, location_name, description, is_active)
SELECT 'A-01-01', 'A-01-01', 'Sample warehouse location', 1
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE location_code = 'A-01-01');

INSERT INTO parts (part_number, part_name, location_id, `timestamp`)
SELECT 'PART-001', 'Sample Warehouse Part', locations.id, NOW()
FROM locations
WHERE locations.location_code = 'A-01-01'
ON DUPLICATE KEY UPDATE
    part_name = VALUES(part_name),
    location_id = VALUES(location_id),
    `timestamp` = VALUES(`timestamp`);
