import * as fetchMock from 'fetch-mock';
import { equals } from 'ramda';

import { Method } from '@/constants';
import {
  AREA,
  CLIENT_KEY,
  EMAIL,
  FIELD,
  ID,
  JSON_HEADERS,
  MOCK_ARR,
  MOCK_OBJ,
  PASSWORD,
  TARGET_AREA,
  TOKEN,
  WINDOWED_REQUEST,
} from './constants';

export default function mockAPI(customer: string, mock = fetchMock.sandbox()) {
  const baseUrl = `https://${customer}.groupbycloud.com`;

  mock
    .post(
      (url, opts) =>
        url === `${baseUrl}/api/v2/login` &&
        equals(opts.headers, JSON_HEADERS) &&
        equals(JSON.parse(opts.body as string), { email: EMAIL, password: PASSWORD }),
      200
    )
    .post((url, opts) => url === `${baseUrl}/api/v2/password/validate` && opts.body === PASSWORD, 200)
    .get(
      (url, opts) =>
        url === `${baseUrl}/admin/v2/grove` && equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }),
      { status: 200, body: JSON.stringify({ grove: 'some_grove' }) }
    )
    .post(
      (url, opts) =>
        url === `${baseUrl}/api/v2/admin/area/promote` &&
        equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
        equals(JSON.parse(opts.body as string), { source: AREA, target: TARGET_AREA }),
      200
    )
    .get(
      (url, opts) => url === `${baseUrl}/api/v2/admin/user/_validate` && equals(opts.headers, { authorization: TOKEN }),
      200
    )
    .get(
      (url, opts) => url === `${baseUrl}/admin/v2/collections` && equals(opts.headers, { authorization: TOKEN }),
      200
    )
    .get(
      (url, opts) => url === `${baseUrl}/api/v2/autocomplete/fields` && equals(opts.headers, { authorization: TOKEN }),
      200
    )
    .get(
      (url, opts) =>
        url === `${baseUrl}/api/v2/autocomplete/values` &&
        equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
        equals(JSON.parse(opts.body as string), { area: AREA, field: FIELD }),
      200
    )
    .mock(
      (url, opts) =>
        url === `${baseUrl}/api/v2/key` &&
        equals(opts.headers, { authorization: TOKEN }) &&
        (!opts.method || [Method.GET, Method.POST, Method.DELETE].includes(opts.method as any)),
      200
    )
    .post(
      (url, opts) =>
        url === `${baseUrl}/api/v2/proxy/search` &&
        equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
        equals(JSON.parse(opts.body as string), {
          query: 'shoe',
          fields: ['title', 'price'],
          pageSize: 2,
        }),
      200
    )
    .get(
      (url, opts) =>
        url === `${baseUrl}/api/v2/collections` &&
        equals(opts.headers, JSON_HEADERS) &&
        equals(JSON.parse(opts.body as string), { clientKey: CLIENT_KEY }),
      200
    );

  function mockWindowed(path: string) {
    mock.post(
      (url, opts) =>
        url === `${baseUrl}/${path}` &&
        equals(opts.headers, { ...JSON_HEADERS, authorization: CLIENT_KEY }) &&
        equals(JSON.parse(opts.body as string), WINDOWED_REQUEST),
      200
    );
  }

  mockWindowed('wisdom/v2/reporting/usage/records');
  mockWindowed('wisdom/v2/reporting/usage/queries/timeseries');
  mockWindowed('wisdom/v2/reporting/searches/_getNull');
  mockWindowed('wisdom/v2/recommendations/searches/_getPopular');
  mockWindowed('wisdom/v2/recommendations/searches/_getTrending');
  mockWindowed('wisdom/v2/recommendations/refinements/_getPopular');

  function mockGlobalModel(path: string) {
    return mock
      .get(
        (url, opts) =>
          url === `${baseUrl}/api/v2/${path}` && equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }),
        200
      )
      .post(
        (url, opts) =>
          url === `${baseUrl}/api/v2/${path}` &&
          equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), MOCK_OBJ),
        200
      )
      .mock(
        (url, opts) =>
          url === `${baseUrl}/api/v2/${path}/${ID}` &&
          equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
          (!opts.method || [Method.GET, Method.DELETE].includes(opts.method as any)),
        200
      )
      .put(
        (url, opts) =>
          url === `${baseUrl}/api/v2/${path}/${ID}` &&
          equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
          equals(JSON.parse(opts.body as string), MOCK_OBJ),
        200
      );
  }

  function mockNamespacedModel(area: string, path: string) {
    const pathSegment = `${area}/${path}`;

    return mockGlobalModel(pathSegment).put(
      (url, opts) =>
        url === `${baseUrl}/api/v2/${pathSegment}` &&
        equals(opts.headers, { ...JSON_HEADERS, authorization: TOKEN }) &&
        equals(JSON.parse(opts.body as string), { models: MOCK_ARR }),
      200
    );
  }

  mockGlobalModel('area');
  mockGlobalModel('user');
  mockNamespacedModel(AREA, 'rule');
  mockNamespacedModel(AREA, 'biasingProfile');
  mockNamespacedModel(AREA, 'matchStrategy');
  mockNamespacedModel(AREA, 'redirect');
  mockNamespacedModel(AREA, 'relatedQuery');
  mockNamespacedModel(AREA, 'navigation');
  mockNamespacedModel(AREA, 'filter');
  mockNamespacedModel(AREA, 'phrase');
  mockNamespacedModel(AREA, 'zone');
  mockNamespacedModel(AREA, 'spelling');
  mockNamespacedModel(AREA, 'synonym');
  mockNamespacedModel(AREA, 'stopWord');
  mockNamespacedModel(AREA, 'template');

  return mock;
}
