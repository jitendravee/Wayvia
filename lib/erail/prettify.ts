/**
 * Ported from the user-supplied Prettify class (erail.in response parser).
 * Logic kept as close to the original as possible — this is scraping-format
 * parsing, so the string offsets/split patterns are load-bearing and should
 * not be "cleaned up" without testing against a live response first.
 *
 * NOTE: I could not test this against the live erail.in site from the build
 * sandbox (no network egress to that domain there). Run this in your own
 * environment and paste back any parsing mismatches if erail.in's response
 * format differs from what's assumed here.
 */

export interface ParsedResult<T> {
  success: boolean;
  time_stamp: number;
  data: T;
}

export interface TrainBase {
  train_no: string;
  train_name: string;
  source_stn_name: string;
  source_stn_code: string;
  dstn_stn_name: string;
  dstn_stn_code: string;
  from_stn_name: string;
  from_stn_code: string;
  to_stn_name: string;
  to_stn_code: string;
  from_time: string; // 'HH:MM'
  to_time: string; // 'HH:MM'
  travel_time: string; // 'HH:MM'
  running_days: string; // e.g. '1111111' indexed by getDayOnDate()
}

export interface BetweenStationEntry {
  train_base: TrainBase;
}

export interface RouteStop {
  source_stn_name: string;
  source_stn_code: string;
  arrive: string;
  depart: string;
  distance: string;
  day: string;
  zone: string;
}

export interface CheckTrainResult {
  train_no: string;
  train_name: string;
  from_stn_name: string;
  from_stn_code: string;
  to_stn_name: string;
  to_stn_code: string;
  from_time: string;
  to_time: string;
  travel_time: string;
  running_days: string;
  type?: string;
  train_id?: string;
  distance_from_to?: string;
  average_speed?: string;
}

export interface LiveStationEntry {
  train_no: string;
  train_name: string;
  source_stn_name: string;
  dstn_stn_name: string;
  time_at: string;
  detail: string;
}

class Prettify {
  BetweenStation(str: string): ParsedResult<BetweenStationEntry[] | string> | undefined {
    try {
      let obj: Partial<TrainBase> = {};
      const retval: Partial<ParsedResult<BetweenStationEntry[] | string>> = {};
      const arr: BetweenStationEntry[] = [];
      let obj2: Partial<BetweenStationEntry> = {};
      let data = str.split("~~~~~~~~");
      let nore = data[0].split("~");
      nore = nore[5].split("<");
      if (nore[0] === "No direct trains found") {
        retval.success = false;
        retval.time_stamp = Date.now();
        retval.data = nore[0];
        return retval as ParsedResult<string>;
      }
      if (
        data[0] === "~~~~~Please try again after some time." ||
        data[0] === "~~~~~From station not found" ||
        data[0] === "~~~~~To station not found"
      ) {
        retval.success = false;
        retval.time_stamp = Date.now();
        retval.data = data[0].replaceAll("~", "");
        return retval as ParsedResult<string>;
      }
      data = data.filter((el) => el != "");
      for (let i = 0; i < data.length; i++) {
        let data1: string[] = data[i].split("~^");
        if (data1.length === 2) {
          let fields = data1[1].split("~");
          fields = fields.filter((el) => el != "");
          obj.train_no = fields[0];
          obj.train_name = fields[1];
          obj.source_stn_name = fields[2];
          obj.source_stn_code = fields[3];
          obj.dstn_stn_name = fields[4];
          obj.dstn_stn_code = fields[5];
          obj.from_stn_name = fields[6];
          obj.from_stn_code = fields[7];
          obj.to_stn_name = fields[8];
          obj.to_stn_code = fields[9];
          obj.from_time = fields[10];
          obj.to_time = fields[11];
          obj.travel_time = fields[12];
          obj.running_days = fields[13];
          obj2.train_base = obj as TrainBase;
          arr.push(obj2 as BetweenStationEntry);
          obj = {};
          obj2 = {};
        }
      }
      retval.success = true;
      retval.time_stamp = Date.now();
      retval.data = arr;
      return retval as ParsedResult<BetweenStationEntry[]>;
    } catch (err) {
      console.warn((err as Error).message);
      return undefined;
    }
  }

  /** Maps a calendar date to erail's day-index convention used in running_days strings. */
  getDayOnDate(DD: number | string, MM: number | string, YYYY: number | string): number {
    const date = new Date(Number(YYYY), Number(MM), Number(DD));
    const day =
      date.getDay() >= 0 && date.getDay() <= 2 ? date.getDay() + 4 : date.getDay() - 3;
    return day;
  }

  GetRoute(str: string): ParsedResult<RouteStop[]> | undefined {
    try {
      const data = str.split("~^");
      const arr: RouteStop[] = [];
      let obj: Partial<RouteStop> = {};
      const retval: Partial<ParsedResult<RouteStop[]>> = {};
      for (let i = 0; i < data.length; i++) {
        let data1 = data[i].split("~");
        data1 = data1.filter((el) => el != "");
        obj.source_stn_name = data1[2];
        obj.source_stn_code = data1[1];
        obj.arrive = data1[3];
        obj.depart = data1[4];
        obj.distance = data1[6];
        obj.day = data1[7];
        obj.zone = data1[9];
        arr.push(obj as RouteStop);
        obj = {};
      }
      retval.success = true;
      retval.time_stamp = Date.now();
      retval.data = arr;
      return retval as ParsedResult<RouteStop[]>;
    } catch (err) {
      console.log((err as Error).message);
      return undefined;
    }
  }

  /** Requires a cheerio $ loaded from the station-live HTML page. */
  LiveStation($: any): ParsedResult<LiveStationEntry[]> {
    const arr: LiveStationEntry[] = [];
    let obj: Partial<LiveStationEntry> = {};
    const retval: Partial<ParsedResult<LiveStationEntry[]>> = {};
    $(".name").each((_i: number, el: any) => {
      obj.train_no = $(el).text().slice(0, 5);
      obj.train_name = $(el).text().slice(5).trim();
      obj.source_stn_name = $(el).next("div").text().split("→")[0]?.trim();
      obj.dstn_stn_name = $(el).next("div").text().split("→")[1]?.trim();
      obj.time_at = $(el).parent("td").next("td").text().slice(0, 5);
      obj.detail = $(el).parent("td").next("td").text().slice(5);
      arr.push(obj as LiveStationEntry);
      obj = {};
    });
    retval.success = true;
    retval.time_stamp = Date.now();
    retval.data = arr;
    return retval as ParsedResult<LiveStationEntry[]>;
  }

  PnrStatus(str: string): ParsedResult<any> {
    const retval: Partial<ParsedResult<any>> = {};
    const pattern = /data\s*=\s*({.*?;)/;
    const match = str.match(pattern);
    if (!match) throw new Error("PNR data block not found in response");
    const jsonLike = match[0].slice(7, -1);
    const data = JSON.parse(jsonLike);
    retval.success = true;
    retval.time_stamp = Date.now();
    retval.data = data;
    return retval as ParsedResult<any>;
  }

  CheckTrain(str: string): ParsedResult<CheckTrainResult | string> | undefined {
    try {
      const obj: Partial<CheckTrainResult> = {};
      const retval: Partial<ParsedResult<CheckTrainResult | string>> = {};
      const data = str.split("~~~~~~~~");
      if (data[0] === "~~~~~Please try again after some time." || data[0] === "~~~~~Train not found") {
        retval.success = false;
        retval.time_stamp = Date.now();
        retval.data = data[0].replaceAll("~", "");
        return retval as ParsedResult<string>;
      }
      let data1 = data[0].split("~");
      data1 = data1.filter((el) => el != "");
      if (data1[1].length > 6) {
        data1.shift();
      }
      obj.train_no = data1[1].replace("^", "");
      obj.train_name = data1[2];
      obj.from_stn_name = data1[3];
      obj.from_stn_code = data1[4];
      obj.to_stn_name = data1[5];
      obj.to_stn_code = data1[6];
      obj.from_time = data1[11];
      obj.to_time = data1[12];
      obj.travel_time = data1[13];
      obj.running_days = data1[14];

      let data2 = data[1]?.split("~") ?? [];
      data2 = data2.filter((el) => el != "");
      obj.type = data2[11];
      obj.train_id = data2[12];
      obj.distance_from_to = data2[18];
      obj.average_speed = data2[19];

      retval.success = true;
      retval.time_stamp = Date.now();
      retval.data = obj as CheckTrainResult;
      return retval as ParsedResult<CheckTrainResult>;
    } catch (err) {
      console.warn((err as Error).message);
      return undefined;
    }
  }
}

export default Prettify;
