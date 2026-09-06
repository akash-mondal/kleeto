import os, sys, json, requests
BASE="https://api.twitterapi.io"; H={"x-api-key":os.environ["TWITTERAPI_IO_KEY"]}
queries=json.loads(sys.argv[1]); out=[]
for q in queries:
    seen=0; cursor=""
    for _ in range(2):
        r=requests.get(f"{BASE}/twitter/tweet/advanced_search",headers=H,
            params={"query":q,"queryType":"Top","cursor":cursor},timeout=60).json()
        for t in r.get("tweets",[]):
            a=t.get("author",{})
            out.append({"q":q,"date":t.get("createdAt","")[:16],"user":a.get("userName"),
                "followers":a.get("followers"),"likes":t.get("likeCount"),"rt":t.get("retweetCount"),
                "views":t.get("viewCount"),"url":t.get("url"),
                "text":(t.get("text","") or "").replace("\n"," ")[:420]})
            seen+=1
        if not r.get("has_next_page"): break
        cursor=r.get("next_cursor","")
    print(f"# {q[:50]!r}: {seen}",file=sys.stderr)
json.dump(out,open(sys.argv[2],"w"),indent=0)
