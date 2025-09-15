-- Update user roles and departments to match the planned structure

-- Update admin user
UPDATE users 
SET role = 'admin', department = 'geral' 
WHERE username = 'admin@mz.dimd';

-- Update supervisor users
UPDATE users 
SET role = 'supervisor', department = 'geral' 
WHERE username = 'manager@mz.dimd';

UPDATE users 
SET role = 'supervisor', department = 'maputo' 
WHERE username = 'manager@maputo.dimd';

-- Update seller users with correct departments
UPDATE users 
SET role = 'vendedor', department = 'maputo' 
WHERE username = 'seller@maputo.dimd';

UPDATE users 
SET role = 'vendedor', department = 'beira' 
WHERE username = 'seller@beira.dimd';

UPDATE users 
SET role = 'vendedor', department = 'nampula' 
WHERE username = 'seller@nampula.dimd';