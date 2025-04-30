# Installing a Local Development Certificate

## 📋 Prerequisites
The certificate file is located in the `certs` folder.

## 📝 Installation Steps

### 📌 1. Access Certificate Files
Locate and access the `root.crt` file in the `certs` folder.

### 📌 2. Open Google Chrome Certificate Management
1. Open Google Chrome.
2. Go to the address bar and enter: `chrome://settings/certificates`  
   Alternatively: Go to **Settings → Privacy and Security → Security → Manage certificates**.

### 📌 3. Import the Certificate
1. Switch to the **"Authorities"** tab.
2. Click on **"Import"**.
3. Select the `root.crt` file that you copied from the Caddy container.
4. Check the box: ✅ **"Trust this certificate for identifying websites"**.
5. Confirm with **OK** and save the settings.

### 📌 4. Restart Chrome
To apply the changes, completely close Chrome and restart it.

### 📌 5. Test
1. Open Chrome and go to:  
   🔗 **https://localhost:8443**
2. If no security warning appears, the certificate was successfully imported! 🎉

**If a warning still appears:**
- Check if the certificate was issued by **Caddy (localhost)**.
- If necessary, repeat the import process and restart Chrome.

## 🚀 Conclusion
✅ Caddy certificate imported  
✅ No more Chrome warnings at **https://localhost:8443**  
✅ Secure local development with HTTPS possible!