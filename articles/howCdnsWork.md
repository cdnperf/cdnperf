# How CDNs Work?

CDN stands for Content Delivery Network. CDNs are used to speed up the performance of websites, video streaming and large files delivery. Each request made to a CDN is always served from a location that is close to the user requesting that content. This results in fast and low latency loading times. A CDN locations is always referred as POP, Point of Presence.

A single CDN location is a big cluster of high-end servers that can server millions of requests with ease. You can be sure that any traffic spikes or DDOS attacks you might have won’t result in any downtime or even slowness. These kind of systems are designed to withstand any kind of load. Plus all CDNs are built with failover features. Even if a location goes down, all traffic will be redirected to next closest location without any downtime.

An average user is using CDNs every day without even knowing it. All Youtube videos are streaming through a CDN, all Microsoft updates are downloaded using a CDN and the same goes for Steam games. Almost every major website is using a CDN to serve their static content.

Most of the CDNs out there use two techniques to load balance the requests. The first one of these is DNS based whereas the latter one is known as anycast IP addressing.

## DNS Based Balancing

In DNS based approach when the user makes a request to content, hostname has to be resolved to an IP address. The company’s nameservers in their turn will check the user’s IP address and based on internal rules of location, uptime, load... will return the IP of a server that is best suited for the user.

The problem here is that the nameservers don’t know the IP address of the user himself but rather of the DNS resolver he is using. So if a user from Australia uses USA based DNS resolvers he will most probably be served content from USA locations.
 
To overcome this problem some public DNS resolvers started using EDNS techniques to provide the real user’s IP address. The problem is that not all DNS resolvers use it and not all CDN companies read them.

## Anycast IP Addressing

The second popular method is using anycast IP addressing. Basically the company uses a single IP address for all of their locations. All data-centers are assigned the same IP and with some smart BGP routing rules the user is automatically routed to closest location to him. 

This kind of load balancing is not easy to pull of and requires owning your own ASN and hardware. On the other hand there is no single point of failure since everything is offloaded to the internet infrastructure itself.
