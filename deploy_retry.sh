#!/bin/bash
echo "Starting aggressive deployment to Puter..."

max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "--- Attempt $attempt ---"
    
    # Run the deployment and capture output
    output=$(puter site deploy . taired-cbt 2>&1)
    echo "$output"
    
    # Check if there was an error in the output
    if echo "$output" | grep -q "Too many requests"; then
        echo "[!] Rate limit hit. Waiting 10 seconds before retrying..."
        sleep 10
        attempt=$((attempt+1))
    elif echo "$output" | grep -q "Deployment successfuly updated"; then
        echo "[+] Success! The site is fully deployed."
        exit 0
    else
        echo "[-] Unknown error or partial success. Check the output."
        # Sometimes it says successfully updated but also had errors, 
        # so let's be careful. If it doesn't have "Too many requests", we assume it passed.
        if echo "$output" | grep -qE "Failed to upload files|fetch failed|ConnectTimeoutError|ERR_UNHANDLED_REJECTION"; then
            echo "[!] Network error or failed files detected. Retrying in 10 seconds..."
            sleep 10
            attempt=$((attempt+1))
        else
            echo "[+] Looks like it deployed cleanly!"
            exit 0
        fi
    fi
done

echo "[-] Exceeded max attempts. Try again later or use the ZIP upload method."
exit 1
