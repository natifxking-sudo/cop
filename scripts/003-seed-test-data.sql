-- Insert test data for development and testing
INSERT INTO users (username, email, role, clearance_level) VALUES
('hq_commander', 'commander@cop.mil', 'HQ', 'SECRET'),
('socmint_analyst1', 'socmint1@cop.mil', 'ANALYST_SOCMINT', 'SECRET'),
('sigint_analyst1', 'sigint1@cop.mil', 'ANALYST_SIGINT', 'TOP_SECRET'),
('humint_analyst1', 'humint1@cop.mil', 'ANALYST_HUMINT', 'SECRET'),
('observer1', 'observer1@cop.mil', 'OBSERVER', 'CONFIDENTIAL');

-- Sample entities
INSERT INTO entities (type, name, attributes, confidence_score, location, created_by, classification) VALUES
('PERSON', 'Target Alpha', '{"age": "35-40", "nationality": "Unknown", "description": "Male, approximately 6ft tall"}', 0.85, ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326), (SELECT id FROM users WHERE username = 'humint_analyst1'), 'SECRET'),
('ORGANIZATION', 'Cell Bravo', '{"size": "5-10 members", "activity": "Suspected terrorist cell"}', 0.75, ST_SetSRID(ST_MakePoint(-73.935, 40.730), 4326), (SELECT id FROM users WHERE username = 'socmint_analyst1'), 'SECRET'),
('FACILITY', 'Compound Charlie', '{"type": "Residential", "floors": 3, "security": "High"}', 0.90, ST_SetSRID(ST_MakePoint(-74.020, 40.720), 4326), (SELECT id FROM users WHERE username = 'sigint_analyst1'), 'SECRET');

-- Sample reports
INSERT INTO reports (type, title, content, location, collection_time, submitted_by, classification, reliability, credibility) VALUES
('SOCMINT', 'Social Media Activity Analysis', '{"platform": "Twitter", "posts": 15, "sentiment": "Negative", "keywords": ["protest", "government"], "engagement": "High"}', ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326), NOW() - INTERVAL '2 hours', (SELECT id FROM users WHERE username = 'socmint_analyst1'), 'CONFIDENTIAL', 'B', '2'),
('SIGINT', 'Communications Intercept', '{"frequency": "145.5 MHz", "duration": "15 minutes", "participants": 2, "language": "Arabic", "encryption": "None"}', ST_SetSRID(ST_MakePoint(-73.935, 40.730), 4326), NOW() - INTERVAL '1 hour', (SELECT id FROM users WHERE username = 'sigint_analyst1'), 'SECRET', 'A', '1'),
('HUMINT', 'Human Source Report', '{"source_code": "HS-001", "meeting_location": "Cafe Downtown", "intelligence_type": "Operational", "reliability_assessment": "Previously reliable"}', ST_SetSRID(ST_MakePoint(-74.020, 40.720), 4326), NOW() - INTERVAL '3 hours', (SELECT id FROM users WHERE username = 'humint_analyst1'), 'SECRET', 'B', '2');

-- Sample events (fused intelligence)
INSERT INTO events (type, title, description, start_time, end_time, location, area_of_interest, confidence_score, sensitivity, status, created_by) VALUES
('MEETING', 'Suspected Cell Meeting', 'Multiple intelligence sources indicate a planned meeting of suspected terrorist cell members', NOW() + INTERVAL '6 hours', NOW() + INTERVAL '8 hours', ST_SetSRID(ST_MakePoint(-74.010, 40.725), 4326), ST_SetSRID(ST_GeomFromText('POLYGON((-74.025 40.715, -73.995 40.715, -73.995 40.735, -74.025 40.735, -74.025 40.715))'), 4326), 0.82, 'SECRET', 'PENDING', (SELECT id FROM users WHERE username = 'socmint_analyst1'));
