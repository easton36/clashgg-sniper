#!/bin/bash

# Variables
total_time=0
count=100

# Execute the command 100 times
for i in $(seq 1 $count); do
    # Execute curl and get the response time
    response_time_float=$(curl 'https://api.clash.gg/' \
                            -H 'Accept-Encoding: gzip, deflate, sdch' \
                            -H 'Accept-Language: en-US,en;q=0.8,ja;q=0.6' \
                            -H 'Upgrade-Insecure-Requests: 1' \
                            -H 'Connection: keep-alive' \
                            --compressed -s -o /dev/null -w "%{time_starttransfer}")
    
    # Convert the floating point number to an integer (milliseconds)
    response_time_ms=$(echo $response_time_float*1000 | awk '{printf "%d", $0}')

    # Print the response time for the current request
    echo "Request $i: $response_time_ms milliseconds"

    # Accumulate the response times
    total_time=$((total_time + response_time_ms))

    # Sleep for 5 seconds
    sleep 5
done

# Calculate the average
average=$((total_time / count))

# Print the result
echo "--------------------------"
echo "Average Response Time: $average milliseconds"
