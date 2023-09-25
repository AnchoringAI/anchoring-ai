# anchoring-ai

Install MySQL on Mac:
```bash
brew install mysql
brew services start mysql
mysql -u root
```
Set up auth for root user:
```sql
UPDATE mysql.user SET authentication_string=null WHERE User='root';
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
SET PASSWORD = '111111';
```
If current password is forgotten, reset:
```bash
brew services stop mysql
pkill mysqld
rm -rf /usr/local/var/mysql/ # NOTE: this deletes the existing DB!
brew postinstall mysql
brew services restart mysql
mysql -u root
```
Initialize tables in local MySQL for local development:
<!-- TODO(ws): Add script to load initial fake data for local dev. -->
```bash
mysql -u root -p111111 -e "DROP DATABASE AnchoringAI;"
mysql -u root -p111111 < src/store/init_db.sql
```
# Run the API server
Set the following environment variables:
- OPENAI_API_KEY
Then run the command:
```bash
./run.sh
