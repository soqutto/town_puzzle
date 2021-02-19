#!/usr/bin/env python3

import sys
import cgi, cgitb

import asyncio
import requests
import base64
from io import BytesIO
from io import StringIO
from PIL import Image

def main():
    #cgitb.enable()
    #print("Content-Type: text/html")
    #print("")

    field_GET = cgi.FieldStorage()
    err = False

    if "x1" not in field_GET or \
       "x2" not in field_GET or \
       "y1" not in field_GET or \
       "y2" not in field_GET or \
       "z" not in field_GET:
           print("Bad request (5 argument required: x1, x2, y1, y2, z)")
           sys.exit()

    out_base64 = True

    x1 = int(field_GET["x1"].value)
    x2 = int(field_GET["x2"].value)
    y1 = int(field_GET["y1"].value)
    y2 = int(field_GET["y2"].value)
    z = int(field_GET["z"].value)
    if "o" in field_GET:
        if field_GET["o"].value == "base64":
            # Base64 output mode(default)
            pass
        elif field_GET["o"].value == "png":
            # PNG output mode
            out_base64 = False


    if x1 > x2:
        print("Bad request (argument x1, x2 must be x1 <= x2)")
        err = True
    if abs(x2 - x1) > 16:
        print("Bad request (argument x1, x2 must be (x2-x1) <= 16)")
        err = True
    if y1 > y2:
        print("Bad request (argument y1, y2 must be y1 <= y2)")
        err = True
    if abs(y2 - y1) > 16:
        print("Bad request (argument y1, y2 must be (y2-y1) <= 16)")
        err = True
    if z < 5 or 18 < z:
        print("Bad request (argument z must be 5 <= z <= 18)")
        err = True

    if(err):
        sys.exit()
    
    tilesV, tilesH = y2-y1+1, x2-x1+1
    h, w = tilesV * 256, tilesH * 256
    dst = Image.new("RGB", (w, h))

    for i in range(tilesV):
        for j in range(tilesH):
            req = requests.get(getURI(x1+j, y1+i, z))
            im = Image.open(BytesIO(req.content))
            dst.paste(im, (j*256, i*256))

    with BytesIO() as bs:
        dst.save(bs, 'png')
        dst_b64 = base64.b64encode(bs.getvalue())
        if(out_base64):
            sys.stdout.buffer.write(b"Content-Type: text/plain\n\n")
            sys.stdout.buffer.write(b"data:image/png;base64,")
            sys.stdout.buffer.write(dst_b64)
        else:
            sys.stdout.buffer.write(b"Content-Type: image/png\n\n")
            sys.stdout.buffer.write(bs.getvalue())

def getURI(x, y, z):
    return "https://cyberjapandata.gsi.go.jp/xyz/pale/{}/{}/{}.png".format(z, x, y)


if __name__ == "__main__":
    main()
